import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

export async function getBrickPackages(rootDir, publicRootWithVersion) {
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
          if (existsSync(bricksJsonPath)) {
            const bricksJson = JSON.parse(
              await readFile(bricksJsonPath, "utf-8")
            );
            if (publicRootWithVersion) {
              const updatedFilePath = bricksJson.filePath.replace(
                "/dist/",
                "/0.0.0/dist/"
              );
              return {
                ...bricksJson,
                filePath: updatedFilePath,
              };
            }
            return bricksJson;
          }
        })
    )
  ).filter(Boolean);
}
