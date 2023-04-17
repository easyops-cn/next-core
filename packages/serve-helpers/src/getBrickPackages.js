import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

/**
 * @param {string} rootDir
 * @param {boolean} publicRootWithVersion
 * @returns {Promise<unknown[]>}
 */
export async function getBrickPackages(rootDir, publicRootWithVersion) {
  return (
    await Promise.all([
      getBrickPackagesInDir(
        path.join(rootDir, "node_modules/@next-bricks"),
        publicRootWithVersion
      ),
      getBrickPackagesInDir(
        path.join(rootDir, "node_modules/@bricks"),
        publicRootWithVersion
      ),
    ])
  ).flat();
}

/**
 *
 * @param {string} bricksDir
 * @param {boolean} publicRootWithVersion
 * @returns {Promise<unknown[]>}
 */
async function getBrickPackagesInDir(bricksDir, publicRootWithVersion) {
  if (!existsSync(bricksDir)) {
    return [];
  }
  const dirs = await readdir(bricksDir, {
    withFileTypes: true,
  });
  return (
    await Promise.all(
      dirs
        .filter((item) => item.isDirectory() || item.isSymbolicLink())
        .map(async (dir) => {
          const bricksJsonPath = path.join(
            bricksDir,
            dir.name,
            "dist/bricks.json"
          );
          if (existsSync(bricksJsonPath)) {
            const bricksJson = JSON.parse(
              await readFile(bricksJsonPath, "utf-8")
            );
            const packageJson = JSON.parse(
              await readFile(
                path.join(bricksDir, dir.name, "package.json"),
                "utf-8"
              )
            );
            if (publicRootWithVersion) {
              const updatedFilePath = bricksJson.filePath.replace(
                "/dist/",
                `/${packageJson.version}/dist/`
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
