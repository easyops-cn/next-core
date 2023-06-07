import path from "node:path";
import { getExamples } from "@next-core/doc-helpers";
import { getBrickManifests } from "@next-core/serve-helpers";

export default function examplesJson(rootDir) {
  return async function (req, res, next) {
    if (req.path !== "/examples.hash.json") {
      next();
      return;
    }
    res.json({
      examples: await getExamples(
        path.join(rootDir, "node_modules/@next-bricks"),
        await getBrickManifests(rootDir)
      ),
    });
  };
}
