import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import express from "express";
import compression from "compression";
import { createProxyMiddleware } from "http-proxy-middleware";
import { getEnv } from "./env.js";
import { injectIndexHtml } from "./utils/injectIndexHtml.js";
import { getMatchedStoryboard } from "./utils/getStoryboards.js";
import { getStandaloneConfig } from "./utils/getStandaloneConfig.js";
import getProxy from "./getProxy.js";
import { shouldServeAsIndexHtml } from "./utils/shouldServeAsIndexHtml.js";
import {
  getMiddlewares,
  getPreMiddlewares,
} from "./middlewares/getMiddlewares.js";
import liveReloadServer from "./utils/liveReloadServer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = await getEnv(process.cwd());
const { baseHref, useLocalContainer, host, port, sizeCheck } = env;
const distDir = path.join(__dirname, "../dist");

const app = express();

if (sizeCheck) {
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
}

app.use((req, res, next) => {
  // DO NOT compress SSE responses
  if (req.headers["accept"] === "text/event-stream") {
    next();
  } else {
    compression()(req, res, next);
  }
});

const middlewares = [
  ...(env.localMocks ?? []),
  ...getPreMiddlewares(env),
  ...getMiddlewares(env),
];

for (const middleware of middlewares) {
  if (typeof middleware === "function") {
    app.use(middleware);
  } else {
    app.use(middleware.path, middleware.middleware);
  }
}

const proxy = getProxy(env, getRawIndexHtml);

const browseHappyHtml = "browse-happy.html";

if (useLocalContainer) {
  // Serve preview
  app.use(
    `${baseHref}_brick-preview-v3_/preview/`,
    express.static(path.join(distDir, "preview"))
  );

  // Serve index.html
  app.use(baseHref, async (req, res, next) => {
    await serveIndexHtml(req, res, next, true, !!proxy);
  });

  // Serve browse-happy.html
  app.get(`${baseHref}${browseHappyHtml}`, (_req, res) => {
    res.sendFile(path.join(distDir, browseHappyHtml));
  });

  const staticHandler = express.static(distDir);
  // Serve static files
  app.use(baseHref, (req, res, next) => {
    if (req.path === "/") {
      next();
      return;
    }
    return staticHandler(req, res, next);
  });

  // Serve static files in next-core for new standalone apps.
  app.use(`${baseHref}sa-static/-/core/0.0.0/`, express.static(distDir));
}

if (proxy) {
  for (const { context, onProxyReq, onProxyRes, ...options } of proxy) {
    app.use(
      createProxyMiddleware({
        logger: {
          info() {
            // Do nothing
          },
          warn(...args) {
            return console.warn(...args);
          },
          error(...args) {
            return console.error(...args);
          },
        },
        ...options,
        pathFilter: context,
        on: {
          ...(onProxyReq ? { proxyReq: onProxyReq } : null),
          ...(onProxyRes ? { proxyRes: onProxyRes } : null),
        },
      })
    );
  }
}

if (useLocalContainer) {
  // Fallback index.html
  app.use(baseHref, async (req, res, next) => {
    await serveIndexHtml(req, res, next);
  });
}

if (env.https) {
  https
    .createServer(
      {
        key: env.https.key,
        cert: env.https.cert,
      },
      app
    )
    .listen(port, host);
} else {
  app.listen(port, host);
}

console.log(`open http${env.https ? "s" : ""}://${host}:${port}${baseHref}`);

liveReloadServer(env);

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function serveIndexHtml(req, res, next, isHome, proxiedHome) {
  if (!shouldServeAsIndexHtml(req, isHome, proxiedHome)) {
    next();
    return;
  }
  const storyboard = await getMatchedStoryboard(env, req.path);
  const content = await getRawIndexHtml();
  res.contentType("html");
  res.send(injectIndexHtml(env, content, getStandaloneConfig(storyboard)));
}

function getRawIndexHtml() {
  const indexHtmlPath = path.join(distDir, "index.html");
  return readFile(indexHtmlPath, "utf-8");
}
