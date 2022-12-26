import path from "node:path";
import WebpackDevServer from "webpack-dev-server";
import { build } from "@next-core/build-next-bricks";
import config from "../build.config.js";
import serveBricks from "./serveBricks.js";

const compiler = await build(config);
const rootDir = path.resolve(process.cwd(), "../..");
const server = new WebpackDevServer(
  {
    open: true,
    setupMiddlewares(middlewares, devServer) {
      serveBricks(devServer.app, rootDir);
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
