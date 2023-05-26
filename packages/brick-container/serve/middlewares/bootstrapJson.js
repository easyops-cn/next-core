import { getBrickPackages } from "@next-core/serve-helpers";
import { getStoryboards } from "../utils/getStoryboards.js";

export default function bootstrapJson({
  rootDir,
  localMicroApps,
  localBricks,
}) {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  return async function (req, res, next) {
    if (req.path === "/" && req.method === "GET") {
      const [storyboards, brickPackages] = await Promise.all([
        getStoryboards({ rootDir, localMicroApps }),
        getBrickPackages(rootDir, false, localBricks),
      ]);

      res.json({
        code: 0,
        data: {
          storyboards: storyboards.filter(Boolean),
          brickPackages,
        },
      });
    } else {
      next();
    }
  };
}
