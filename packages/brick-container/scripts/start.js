import path from "node:path";
import WebpackDevServer from "webpack-dev-server";
import { build } from "@next-core/build-next-bricks";
import config from "../build.config.js";
import { getEnv } from "../serve/env.js";
import { injectIndexHtml } from "../serve/utils/injectIndexHtml.js";
import { getMatchedStoryboard } from "../serve/utils/getStoryboards.js";
import { getStandaloneConfig } from "../serve/utils/getStandaloneConfig.js";
import getProxy from "../serve/getProxy.js";
import { shouldServeAsIndexHtml } from "../serve/utils/shouldServeAsIndexHtml.js";
import {
  getMiddlewares,
  getPreMiddlewares,
} from "../serve/middlewares/getMiddlewares.js";
import liveReloadServer from "../serve/utils/liveReloadServer.js";

const env = await getEnv(path.join(process.cwd(), "../.."));
const { rootDir, baseHref, port } = env;
const distDir = path.join(process.cwd(), "dist");

const compiler = await build(config);
const server = new WebpackDevServer(
  {
    open: [baseHref],
    host: "localhost",
    port,
    hot: true,
    client: {
      overlay: false,
    },
    devMiddleware: {
      publicPath: baseHref,
    },
    setupMiddlewares(middlewares) {
      if (baseHref !== "/") {
        middlewares.unshift(
          /**
           * @param {import("express").Request} req
           * @param {import("express").Response} res
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

      middlewares.unshift(...getPreMiddlewares(env));

      middlewares.push(...getMiddlewares(env));

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

      if (env.localMocks) {
        middlewares.unshift(...env.localMocks);
      }

      return middlewares;
    },
    watchFiles: [path.join(rootDir, "bricks/*/dist/*")],
    proxy: getProxy(env, getRawIndexHtml),
  },
  compiler
);

const runServer = async () => {
  console.log("Starting server...");
  await server.start();
};

await runServer();

liveReloadServer(env);

const ready = new Promise((resolve) => {
  server.middleware.waitUntilValid(resolve);
});

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function serveIndexHtml(req, res, next, isHome) {
  if (!shouldServeAsIndexHtml(req, isHome)) {
    next();
    return;
  }
  const [storyboard, rawIndexHtml] = await Promise.all([
    getMatchedStoryboard(env, req.path),
    getRawIndexHtml(),
  ]);
  res.contentType("html");
  res.send(injectIndexHtml(env, rawIndexHtml, getStandaloneConfig(storyboard)));
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function serveStandaloneCoreStatic(req, res, next) {
  if (req.method !== "GET") {
    next();
    return;
  }

  await ready;

  const staticFilePath = path.join(distDir, req.path);
  compiler.outputFileSystem.readFile(staticFilePath, (err, content) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.contentType(path.basename(staticFilePath));
      res.send(content);
    }
  });
}

async function getRawIndexHtml() {
  await ready;
  const indexHtmlPath = path.join(distDir, "index.html");
  return new Promise((resolve, reject) => {
    compiler.outputFileSystem.readFile(indexHtmlPath, (err, content) => {
      if (err) {
        reject(err);
      } else {
        resolve(String(content));
      }
    });
  });
}
