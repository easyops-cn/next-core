import path from "node:path";
import { tryServeFiles } from "@next-core/serve-helpers";

export default function serveBricksWithVersions({ rootDir }) {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
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
      res,
      next
    );
  };
}
