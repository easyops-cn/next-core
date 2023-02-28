import {
  getStoryboards,
  getSingleStoryboard,
} from "../utils/getStoryboards.js";
import { getBrickPackages } from "../utils/getBrickPackages.js";

export default function bootstrapJson({ rootDir, localMicroApps }) {
  const baseBootstrapRegExp = /^\/api\/auth\/v2\/bootstrap\/?$/;
  const singleAppBootstrapRegExp = /^\/api\/auth\/v2\/bootstrap\/\w+$/;
  const saBootstrapRegExp =
    /^\/sa-static\/[^/]+\/versions\/[^/]+\/webroot\/-\/bootstrap\.[^.]+\.json$/;

  /**
   * @param req {import("express").Request}
   * @param res {import("express").Response}
   */
  return async function (req, res, next) {
    if (baseBootstrapRegExp.test(req.path) && req.method === "GET") {
      const [storyboards, brickPackages] = await Promise.all([
        getStoryboards({ rootDir, localMicroApps }),
        getBrickPackages(rootDir),
      ]);

      res.json({
        code: 0,
        data: {
          storyboards: storyboards.filter(Boolean),
          brickPackages,
        },
      });
    } else if (
      singleAppBootstrapRegExp.test(req.path) &&
      req.method === "GET"
    ) {
      const appId = req.path.split("/").pop();
      const storyboard = await getSingleStoryboard(rootDir, appId);
      if (storyboard) {
        res.json({
          code: 0,
          data: storyboard,
        });
      } else {
        res.status(404);
        res.send("Storyboard not found");
      }
    } else if (saBootstrapRegExp.test(req.path) && req.method === "GET") {
      const appId = req.path.split("/", 3)[2];
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
