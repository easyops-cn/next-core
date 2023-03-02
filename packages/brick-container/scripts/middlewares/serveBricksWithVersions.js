import { tryServeFiles } from "@next-core/serve-helpers";
import path from "node:path";

export default function serveBricksWithVersions({ rootDir }) {
  /**
   * @param req {import("express").Request}
   * @param res {import("express").Response}
   */
  return async function (req, res, next) {
    if (
      req.method !== "GET" ||
      !/^\/[^/]+\/\d+\.\d+\.\d+\/dist\//.test(req.path)
    ) {
      next();
      return;
    }

    const segments = req.path.split("/");
    // Remove the version part.
    segments.splice(2, 1);

    tryServeFiles(
      [
        path.join(rootDir, "node_modules/@next-bricks", segments.join("/")),
        path.join(rootDir, "node_modules/@bricks", segments.join("/")),
      ],
      req,
      res
    );
  };
}
