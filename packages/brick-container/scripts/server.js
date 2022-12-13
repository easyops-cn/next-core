import path from "node:path";
import fs from "node:fs";
import WebpackDevServer from "webpack-dev-server";
import { build } from "@next-core/build-next-bricks";
import config from "../bricks.config.js";

const compiler = await build(config);
const server = new WebpackDevServer(
  {
    open: true,
    // proxy: {
    //   "/bricks": {

    //   }
    // },
    setupMiddlewares(middlewares, devServer) {
      devServer.app.get("/bricks/:pkgId/dist/*", (req, res) => {
        console.log("req:", req.path);
        const filePath = path.resolve(process.cwd(), `../..${req.path}`);
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).send("Not found");
        }
      });

      return middlewares;
    },
  },
  compiler
);

const runServer = async () => {
  console.log("Starting server...");
  await server.start();
};

runServer();
