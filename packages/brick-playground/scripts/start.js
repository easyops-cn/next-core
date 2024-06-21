import path from "node:path";
import { existsSync } from "node:fs";
import WebpackDevServer from "webpack-dev-server";
import express from "express";
import glob from "glob";
import { build } from "@next-core/build-next-bricks";
import config from "../build.config.js";
import bootstrapJson from "../serve/bootstrapJson.js";
import examplesJson from "../serve/examplesJson.js";

const compiler = await build(config);
const packageDir = process.cwd();
const rootDir = path.resolve(packageDir, "../..");

let brickFolders = ["node_modules/@next-bricks", "node_modules/@bricks"];
const devConfigMjs = path.join(rootDir, "dev.config.mjs");
let configuredBrickFolders = false;

if (existsSync(devConfigMjs)) {
  const devConfig = (await import(devConfigMjs)).default;
  if (devConfig) {
    if (Array.isArray(devConfig.brickFolders)) {
      brickFolders = devConfig.brickFolders;
      configuredBrickFolders = true;
    }
  }
}

const localBrickFolders = (
  await Promise.all(
    brickFolders.map(
      (folder) =>
        new Promise((resolve, reject) => {
          glob(path.resolve(rootDir, folder), {}, (err, matches) => {
            if (err) {
              reject(err);
            } else {
              resolve(matches);
            }
          });
        })
    )
  )
).flat();

if (configuredBrickFolders) {
  console.log("local brick folders:", localBrickFolders);
}

const server = new WebpackDevServer(
  {
    open: true,
    port: 8082,
    setupMiddlewares(middlewares) {
      for (const folder of localBrickFolders) {
        middlewares.push({
          path: "/preview/bricks/",
          middleware: express.static(folder),
        });
      }

      middlewares.push({
        path: "/preview/",
        middleware: bootstrapJson(localBrickFolders),
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
