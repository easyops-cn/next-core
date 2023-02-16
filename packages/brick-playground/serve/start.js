import path from "node:path";
import WebpackDevServer from "webpack-dev-server";
import express from "express";
import { build } from "@next-core/build-next-bricks";
import config from "../build.config.js";
import bootstrapJson from "./bootstrapJson.js";

const compiler = await build(config);
const rootDir = path.resolve(process.cwd(), "../..");
const server = new WebpackDevServer(
  {
    open: true,
    port: 8082,
    setupMiddlewares(middlewares) {
      middlewares.unshift({
        path: "/bricks/",
        middleware: express.static(path.join(rootDir, "bricks")),
      });

      middlewares.unshift(bootstrapJson(rootDir));

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
