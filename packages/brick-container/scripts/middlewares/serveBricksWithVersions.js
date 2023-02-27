import path from "node:path";

export default function serveBricksWithVersions({ rootDir }) {
  /**
   * @param req {import("express").Request}
   * @param res {import("express").Response}
   */
  return async function (req, res, next) {
    if (req.method !== "GET" || !/^\/[^/]+\/0\.0\.0\/dist\//.test(req.path)) {
      next();
      return;
    }

    const segments = req.path.split("/");
    // Remove the version part.
    segments.splice(2, 1);
    const targetFilePath = path.join(rootDir, "bricks", segments.join("/"));
    res.sendFile(targetFilePath);
  };
}
