import path from "node:path";
import { readFile } from "node:fs/promises";
import express from "express";
import compression from "compression";
import { createProxyMiddleware } from "http-proxy-middleware";
import { getEnv } from "./env.js";
import bootstrapJson from "./middlewares/bootstrapJson.js";
import mockAuth from "./middlewares/mockAuth.js";
import serveBricksWithVersions from "./middlewares/serveBricksWithVersions.js";
import { injectIndexHtml } from "./utils/injectIndexHtml.js";
import { getMatchedStoryboard } from "./utils/getStoryboards.js";
import { getStandaloneConfig } from "./utils/getStandaloneConfig.js";
import getProxy from "./getProxy.js";
import standaloneBootstrapJson from "./middlewares/standaloneBootstrapJson.js";
import { shouldServeAsIndexHtml } from "./utils/shouldServeAsIndexHtml.js";

const env = getEnv();
const {
  rootDir,
  baseHref,
  useRemote,
  useLocalContainer,
  port,
  localMicroApps,
} = env;
const distDir = path.join(process.cwd(), "dist");

const app = express();

app.use(compression());

app.use(`${baseHref}sa-static/-/bricks/`, serveBricksWithVersions(env));
app.use(
  `${baseHref}bricks/`,
  express.static(path.join(rootDir, "node_modules/@next-bricks"))
);
app.use(
  `${baseHref}bricks/`,
  express.static(path.join(rootDir, "node_modules/@bricks"))
);

if (useRemote) {
  for (const appId of localMicroApps) {
    app.use(
      `${baseHref}sa-static/${appId}/versions/0.0.0/webroot/-/`,
      standaloneBootstrapJson(env, appId)
    );
  }
} else {
  app.use(baseHref, mockAuth());
  app.use(baseHref, bootstrapJson(env));
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
  // For legacy standalone apps.
  // app.use(`${baseHref}:appId/-/core/`, express.static(distDir));
}

const proxy = getProxy(env);
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
  const indexHtmlPath = path.join(distDir, "index.html");
  const content = await readFile(indexHtmlPath, "utf-8");
  res.contentType("html");
  res.send(injectIndexHtml(env, content, getStandaloneConfig(storyboard)));
}
