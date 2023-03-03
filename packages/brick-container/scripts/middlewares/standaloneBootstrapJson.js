import { getBrickPackages } from "@next-core/serve-helpers";
import { getSingleStoryboard } from "../utils/getStoryboards.js";

export default function standaloneBootstrapJson({ rootDir }, appId) {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  return async function (req, res, next) {
    if (req.path === "/bootstrap.hash.json" && req.method === "GET") {
      const [storyboard, brickPackages] = await Promise.all([
        getSingleStoryboard(rootDir, appId),
        getBrickPackages(rootDir, true),
      ]);

      if (storyboard) {
        res.json({
          storyboards: [storyboard],
          brickPackages,
        });
      } else {
        res.status(404);
        res.send(`Storyboard not found: ${appId}`);
      }
    } else {
      next();
    }
  };
}
