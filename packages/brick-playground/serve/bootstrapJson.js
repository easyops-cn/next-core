import path from "node:path";
import { getBrickPackages } from "@next-core/serve-helpers";

export default function bootstrapJson(rootDir) {
  return async function (req, res, next) {
    if (req.path !== "/bootstrap.hash.json") {
      next();
      return;
    }
    res.json({
      brickPackages: await getBrickPackages(
        ["@next-bricks", "@bricks"].map((scope) =>
          path.join(rootDir, "node_modules", scope)
        )
      ),
      settings: {
        misc: {
          weather_api_key: "9e08e5e99e0c4b4c89023605231804",
        },
      },
    });
  };
}
