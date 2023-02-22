import path from "node:path";
import WebpackDevServer from "webpack-dev-server";
import express from "express";
import { build } from "@next-core/build-next-bricks";
import config from "../build.config.js";
import bootstrapJson from "./bootstrapJson.js";
import mockAuth from "./mockAuth.js";

const compiler = await build(config);
const rootDir = path.resolve(process.cwd(), "../..");
const server = new WebpackDevServer(
  {
    open: true,
    setupMiddlewares(middlewares) {
      middlewares.push({
        path: "/bricks/",
        middleware: express.static(path.join(rootDir, "bricks")),
      });

      middlewares.push(mockAuth());
      middlewares.push(bootstrapJson(rootDir));

      middlewares.push({
        name: "try_files index.html",
        middleware(req, res) {
          const fs = compiler.outputFileSystem;
          const indexHtmlPath = path.join(process.cwd(), "dist/index.html");
          fs.readFile(indexHtmlPath, (err, content) => {
            if (err) {
              res.sendStatus(500);
            } else {
              res.contentType("html");
              res.send(content);
            }
          });
        },
      });

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
