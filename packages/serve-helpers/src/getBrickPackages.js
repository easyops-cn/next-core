import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

/**
 * @param {string} rootDir
 * @param {boolean | undefined} publicRootWithVersion
 * @param {string[] | undefined} localBricks
 * @returns {Promise<unknown[]>}
 */
export async function getBrickPackages(
  rootDir,
  publicRootWithVersion,
  localBricks
) {
  return (
    await Promise.all(
      ["@next-bricks", "@bricks"].map((scope) =>
        getBrickPackagesInDir(
          path.join(rootDir, "node_modules", scope),
          publicRootWithVersion,
          localBricks
        )
      )
    )
  ).flat();
}

/**
 * @param {string} rootDir
 * @param {string[] | undefined} localBricks
 * @returns {Promise<string[]>}
 */
export async function getLocalBrickPackageNames(rootDir, localBricks) {
  return (
    await Promise.all(
      ["@next-bricks", "@bricks"].map((scope) =>
        getBrickPackageNamesInDir(
          path.join(rootDir, "node_modules", scope),
          localBricks
        )
      )
    )
  ).flat();
}

/**
 * @param {string} bricksDir
 * @param {string[] | undefined} localBricks
 * @returns {Promise<string[]>}
 */
async function getBrickPackageNamesInDir(bricksDir, localBricks) {
  if (!existsSync(bricksDir)) {
    return [];
  }
  const dirs = await readdir(bricksDir, {
    withFileTypes: true,
  });
  return (
    await Promise.all(
      dirs
        .filter(
          (item) =>
            (item.isDirectory() || item.isSymbolicLink()) &&
            (!localBricks || localBricks.includes(item.name))
        )
        .map(async (dir) => {
          const bricksJsonPath = path.join(
            bricksDir,
            dir.name,
            "dist/bricks.json"
          );
          if (existsSync(bricksJsonPath)) {
            return dir.name;
          }
        })
    )
  ).filter(Boolean);
}

/**
 *
 * @param {string} bricksDir
 * @param {boolean | undefined} publicRootWithVersion
 * @param {string[] | undefined} localBricks
 * @returns {Promise<unknown[]>}
 */
async function getBrickPackagesInDir(
  bricksDir,
  publicRootWithVersion,
  localBricks
) {
  return Promise.all(
    (await getBrickPackageNamesInDir(bricksDir, localBricks)).map(
      async (dirName) => {
        const bricksJsonPath = path.join(
          bricksDir,
          dirName,
          "dist/bricks.json"
        );
        const bricksJson = JSON.parse(await readFile(bricksJsonPath, "utf-8"));
        const packageJson = JSON.parse(
          await readFile(path.join(bricksDir, dirName, "package.json"), "utf-8")
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
    )
  );
}
