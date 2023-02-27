import path from "node:path";
import WebpackDevServer from "webpack-dev-server";
import express from "express";
import { build } from "@next-core/build-next-bricks";
import config from "../build.config.js";
import { getEnv } from "./env.js";
import bootstrapJson from "./middlewares/bootstrapJson.js";
import mockAuth from "./middlewares/mockAuth.js";
import serveBricksWithVersions from "./middlewares/serveBricksWithVersions.js";
import { injectIndexHtml } from "./utils/injectIndexHtml.js";
import { getMatchedStoryboard } from "./utils/getStoryboards.js";
import { getStandaloneConfig } from "./utils/getStandaloneConfig.js";
import getProxy from "./getProxy.js";

const env = getEnv();

const { rootDir, baseHref, port, useRemote } = env;

const compiler = await build(config);
const server = new WebpackDevServer(
  {
    open: [baseHref],
    host: "localhost",
    port,
    hot: true,
    devMiddleware: {
      publicPath: baseHref,
    },
    setupMiddlewares(middlewares) {
      if (baseHref !== "/") {
        middlewares.unshift(
          /**
           * @param req {import("express").Request}
           * @param res {import("express").Response}
           */
          async function redirect(req, res, next) {
            if (req.path === "/" && req.method === "GET") {
              res.redirect(baseHref);
            } else {
              next();
            }
          }
        );
      }

      middlewares.unshift({
        path: baseHref,
        async middleware(req, res, next) {
          await serveIndexHtml(req, res, next, true);
        },
      });

      middlewares.push({
        path: `${baseHref}sa-static/-/bricks/`,
        middleware: serveBricksWithVersions(env),
      });

      middlewares.push({
        path: `${baseHref}bricks/`,
        middleware: express.static(path.join(rootDir, "bricks")),
      });

      if (!useRemote) {
        middlewares.push({
          path: baseHref,
          middleware: mockAuth(),
        });
      }
      middlewares.push({
        path: baseHref,
        middleware: bootstrapJson(env),
      });

      middlewares.push({
        path: `${baseHref}sa-static/-/core/0.0.0/`,
        middleware: serveStandaloneCoreStatic,
      });

      middlewares.push({
        name: "try_files index.html",
        path: baseHref,
        async middleware(req, res, next) {
          if (req.method !== "GET") {
            next();
            return;
          }
          await serveIndexHtml(req, res, next);
        },
      });

      return middlewares;
    },
    watchFiles: [path.join(rootDir, "bricks/*/dist/*")],
    proxy: getProxy(env),
  },
  compiler
);

const runServer = async () => {
  console.log("Starting server...");
  await server.start();
};

await runServer();

const ready = new Promise((resolve) => {
  server.middleware.waitUntilValid(resolve);
});

/**
 * @param req {import("express").Request}
 * @param res {import("express").Response}
 */
async function serveIndexHtml(req, res, next, isHome) {
  if (req.method !== "GET" || (isHome && req.path !== "/")) {
    next();
    return;
  }
  const [storyboard] = await Promise.all([
    getMatchedStoryboard(env, req.path),
    ready,
  ]);
  if (!storyboard) {
    console.log(">>> storyboard not found for:", req.path);
    next();
    return;
  }
  const indexHtmlPath = path.join(process.cwd(), "dist/index.html");
  compiler.outputFileSystem.readFile(indexHtmlPath, (err, content) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.contentType("html");
      res.send(
        injectIndexHtml(env, String(content), getStandaloneConfig(storyboard))
      );
    }
  });
}

/**
 * @param req {import("express").Request}
 * @param res {import("express").Response}
 */
async function serveStandaloneCoreStatic(req, res, next) {
  if (req.method !== "GET") {
    next();
    return;
  }

  await ready;

  const staticFilePath = path.join(process.cwd(), "dist", req.path);
  compiler.outputFileSystem.readFile(staticFilePath, (err, content) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.contentType(path.basename(staticFilePath));
      res.send(content);
    }
  });
}
