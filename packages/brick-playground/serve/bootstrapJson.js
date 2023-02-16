import path from "node:path";
import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";

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

async function getBrickPackages(rootDir) {
  const dirs = await readdir(path.join(rootDir, "bricks"), {
    withFileTypes: true,
  });
  return (
    await Promise.all(
      dirs
        .filter((item) => item.isDirectory())
        .map(async (dir) => {
          const bricksJsonPath = path.join(
            rootDir,
            "bricks",
            dir.name,
            "dist/bricks.json"
          );
          if (fs.existsSync(bricksJsonPath)) {
            const files = await readdir(path.dirname(bricksJsonPath));
            const indexJsFile = files.find((item) => item.endsWith(".js"));
            if (indexJsFile) {
              const bricksJson = JSON.parse(
                await readFile(bricksJsonPath, "utf-8")
              );
              return {
                filePath: indexJsFile,
                ...bricksJson,
              };
            }
          }
        })
    )
  ).filter(Boolean);
}
