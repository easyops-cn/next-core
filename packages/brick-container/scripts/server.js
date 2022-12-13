import path from "node:path";
import fs from "node:fs";
import WebpackDevServer from "webpack-dev-server";
import { build } from "@next-core/build-next-bricks";
import config from "../bricks.config.js";

const compiler = await build(config);
const rootDir = path.resolve(process.cwd(), "../..");
const server = new WebpackDevServer(
  {
    open: true,
    setupMiddlewares(middlewares, devServer) {
      devServer.app.get("/bricks/:pkgId/dist/*", (req, res) => {
        const filePath = path.join(rootDir, req.path);
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).send("Not found");
        }
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
