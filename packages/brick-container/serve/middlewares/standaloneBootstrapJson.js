import { getBrickPackages } from "@next-core/serve-helpers";
import { getSingleStoryboard } from "../utils/getStoryboards.js";
import { getSizeCheckStoryboards } from "../utils/sizeCheck.js";

export default function standaloneBootstrapJson({ rootDir }, appId) {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  return async function (req, res, next) {
    if (req.path === "/" && req.method === "GET") {
      const [storyboard, brickPackages] = await Promise.all([
        getSingleStoryboard(rootDir, appId),
        getBrickPackages(rootDir, true),
      ]);

      if (appId === "-size-check-") {
        res.json({
          storyboards: getSizeCheckStoryboards(brickPackages),
          brickPackages,
          settings: getE2eSettings(),
        });
      } else if (storyboard) {
        res.json({
          storyboards: [storyboard],
          brickPackages,
          settings: appId === "e2e" ? getE2eSettings() : undefined,
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

function getE2eSettings() {
  return {
    presetBricks: {
      notification: false,
      dialog: false,
    },
  };
}
