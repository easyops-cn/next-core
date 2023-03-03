import { getBrickPackages } from "@next-core/serve-helpers";

export default function bootstrapJson(rootDir) {
  return async function (req, res, next) {
    if (req.path !== "/bootstrap.hash.json") {
      next();
      return;
    }
    res.json({
      brickPackages: await getBrickPackages(rootDir),
    });
  };
}
