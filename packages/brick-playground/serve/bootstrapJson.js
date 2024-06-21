import { getBrickPackages } from "@next-core/serve-helpers";

export default function bootstrapJson(localBrickFolders) {
  return async function (req, res, next) {
    if (req.path !== "/bootstrap.hash.json") {
      next();
      return;
    }
    const brickPackages = await getBrickPackages(localBrickFolders);
    res.json({
      brickPackages,
      settings: {
        misc: {
          weather_api_key: "9e08e5e99e0c4b4c89023605231804",
          local_editors: getLocalEditors(brickPackages),
        },
      },
    });
  };
}

function getLocalEditors(brickPackages) {
  return brickPackages.flatMap((pkg) =>
    pkg.id ? pkg.editors ?? [] : pkg.propertyEditors ?? []
  );
}
