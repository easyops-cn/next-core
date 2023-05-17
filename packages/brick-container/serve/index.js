import path from "node:path";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = getEnv(process.cwd());
const { baseHref, useLocalContainer, port, sizeCheck } = env;
const distDir = path.join(__dirname, "../dist");

const app = express();

if (sizeCheck) {
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
}

app.use(compression());

const middlewares = [...getPreMiddlewares(env), ...getMiddlewares(env)];

for (const middleware of middlewares) {
  if (typeof middleware === "function") {
    app.use(middleware);
  } else {
    app.use(middleware.path, middleware.middleware);
  }
}

const browseHappyHtml = "browse-happy.html";

if (useLocalContainer) {
  // Serve index.html
  app.use(baseHref, async (req, res, next) => {
    await serveIndexHtml(req, res, next, true);
  });

  // Serve browse-happy.html
  app.get(`${baseHref}${browseHappyHtml}`, (req, res) => {
    res.sendFile(path.join(distDir, browseHappyHtml));
  });

  // Serve static files
  app.use(baseHref, express.static(distDir));

  // Serve static files in next-core for new standalone apps.
  app.use(`${baseHref}sa-static/-/core/0.0.0/`, express.static(distDir));
}

const proxy = getProxy(env, getRawIndexHtml);
if (proxy) {
  for (const options of proxy) {
    app.use(
      createProxyMiddleware(options.context, {
        logLevel: "warn",
        ...options,
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

app.listen(port);

console.log(`open http://localhost:${port}${baseHref}`);

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function serveIndexHtml(req, res, next, isHome) {
  if (!shouldServeAsIndexHtml(req, isHome)) {
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
