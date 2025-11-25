import path from "node:path";
import { tryServeFiles } from "@next-core/serve-helpers";

export default function serveAppImages({ rootDir }, appId) {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  return async function (req, res, next) {
    if (req.method !== "GET") {
      next();
      return;
    }

    tryServeFiles(
      ["mock-micro-apps", "apps"].map((folder) =>
        path.join(rootDir, folder, appId, "dist/images", req.path)
      ),
      req,
      res,
      next
    );
  };
}
