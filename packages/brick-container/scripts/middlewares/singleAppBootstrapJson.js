import { getSingleStoryboard } from "../utils/getStoryboards.js";

export default function singleAppBootstrapJson({ rootDir }, appId) {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  return async function (req, res, next) {
    if (req.path === "/" && req.method === "GET") {
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
    } else {
      next();
    }
  };
}
