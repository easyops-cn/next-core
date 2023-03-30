import path from "node:path";
import WebpackDevServer from "webpack-dev-server";
import express from "express";
import { build } from "@next-core/build-next-bricks";
import config from "../build.config.js";
import bootstrapJson from "../serve/bootstrapJson.js";
import examplesJson from "../serve/examplesJson.js";

const compiler = await build(config);
const packageDir = process.cwd();
const rootDir = path.resolve(packageDir, "../..");
const server = new WebpackDevServer(
  {
    open: true,
    port: 8082,
    setupMiddlewares(middlewares) {
      middlewares.push({
        path: "/preview/bricks/",
        middleware: express.static(
          path.join(rootDir, "node_modules/@next-bricks")
        ),
      });
      middlewares.push({
        path: "/preview/bricks/",
        middleware: express.static(path.join(rootDir, "node_modules/@bricks")),
      });

      middlewares.push({
        path: "/preview/",
        middleware: bootstrapJson(rootDir),
      });
      middlewares.push(examplesJson(rootDir));

      return middlewares;
    },
    watchFiles: [path.join(rootDir, "bricks/*/dist/*")],
  },
  compiler
);

const runServer = async () => {
  console.log("Starting server...");
  await server.start();
};

runServer();
