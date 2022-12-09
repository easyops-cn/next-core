import WebpackDevServer from "webpack-dev-server";
import { build } from "@next-core/build-next-bricks";
import config from "./bnb.config.js";

const compiler = await build(config);
const devServerOptions = { open: true };
const server = new WebpackDevServer(devServerOptions, compiler);

const runServer = async () => {
  console.log("Starting server...");
  await server.start();
};

runServer();
