import path from "node:path";
import WebpackDevServer from "webpack-dev-server";
import compression from "compression";
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
const { rootDir, baseHref, host, port } = env;
const distDir = path.join(process.cwd(), "dist");

const compiler = await build(config);
const server = new WebpackDevServer(
  {
    open: [baseHref],
    host,
    port,
    hot: true,
    client: {
      overlay: false,
    },
    devMiddleware: {
      publicPath: baseHref,
    },
    // Manually compress the response to avoid compressing SSE responses
    compress: false,
    setupMiddlewares(middlewares) {
      middlewares.unshift(
        /**
         * @param {import("express").Request} req
         * @param {import("express").Response} res
         */
        async function compress(req, res, next) {
          // DO NOT compress SSE responses
          if (req.headers["accept"] === "text/event-stream") {
            next();
          } else {
            compression()(req, res, next);
          }
        }
      );

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

      middlewares.unshift({
        path: `${baseHref}_brick-preview-v3_/preview/`,
        async middleware(req, res) {
          await servePreviewHtml(req, res);
        },
      });

      middlewares.unshift(...getPreMiddlewares(env));

      middlewares.unshift((req, res, next) => {
        res.set("Access-Control-Allow-Origin", "http://localhost:9000");
        res.set("Access-Control-Allow-Credentials", "true");
        res.set("Access-Control-Allow-Headers", "content-type, x-b3-traceid, x-b3-spanid, x-b3-sampled, lang");
        if (req.method === "OPTIONS") {
          res.sendStatus(200);
          return;
        }
        next();
      });

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
async function servePreviewHtml(req, res) {
  const filePath = path.join(
    "preview",
    req.path === "/" ? "index.html" : req.path
  );
  let content;
  try {
    content = await getRawContent(filePath);
  } catch {
    res.sendStatus(404);
    return;
  }
  res.type(path.extname(filePath));
  res.send(req.path === "/" ? injectIndexHtml(env, content) : content);
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
  return getRawContent("index.html");
}

async function getRawContent(filePath) {
  await ready;
  const absoluteFilePath = path.join(distDir, filePath);
  return new Promise((resolve, reject) => {
    compiler.outputFileSystem.readFile(absoluteFilePath, (err, content) => {
      if (err) {
        reject(err);
      } else {
        resolve(String(content));
      }
    });
  });
}
