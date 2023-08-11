import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

/**
 * @param {string[]} localBrickFolders
 * @param {boolean | undefined} publicRootWithVersion
 * @param {string[] | undefined} localBricks
 * @returns {Promise<unknown[]>}
 */
export async function getBrickPackages(
  localBrickFolders,
  publicRootWithVersion,
  localBricks
) {
  return (
    await Promise.all(
      localBrickFolders.map((dir) =>
        getBrickPackagesInDir(dir, publicRootWithVersion, localBricks)
      )
    )
  ).flat();
}

/**
 * @param {string[]} localBrickFolders
 * @param {string[] | undefined} localBricks
 * @returns {Promise<string[]>}
 */
export async function getLocalBrickPackageNames(
  localBrickFolders,
  localBricks
) {
  return (
    await Promise.all(
      localBrickFolders.map((dir) =>
        getBrickPackageNamesInDir(dir, localBricks)
      )
    )
  ).flat();
}

/**
 * @param {string} rootDir
 * @param {string[] | undefined} localBricks
 * @returns {Promise<unknown[]>}
 */
export async function getBrickManifests(rootDir, localBricks) {
  return (
    await Promise.all(
      ["@next-bricks", "@bricks"].map((scope) =>
        getBrickManifestsInDir(
          path.join(rootDir, "node_modules", scope),
          localBricks
        )
      )
    )
  ).flat();
}

/**
 *
 * @param {string} bricksDir
 * @param {string[] | undefined} localBricks
 * @returns {Promise<unknown[]>}
 */
async function getBrickManifestsInDir(bricksDir, localBricks) {
  return Promise.all(
    (
      await getBrickPackageNamesInDir(
        bricksDir,
        localBricks,
        "dist/manifest.json"
      )
    ).map(async (dirName) => {
      const manifestJsonPath = path.join(
        bricksDir,
        dirName,
        "dist/manifest.json"
      );
      return JSON.parse(await readFile(manifestJsonPath, "utf-8"));
    })
  );
}

/**
 * @param {string} bricksDir
 * @param {string[] | undefined} localBricks
 * @param {string | undefined} file
 * @returns {Promise<string[]>}
 */
async function getBrickPackageNamesInDir(
  bricksDir,
  localBricks,
  file = "dist/bricks.json"
) {
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
          const bricksJsonPath = path.join(bricksDir, dir.name, file);
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
        if (publicRootWithVersion) {
          const packageJsonPath = path.join(bricksDir, dirName, "package.json");
          const packageJson = existsSync(packageJsonPath)
            ? JSON.parse(await readFile(packageJsonPath, "utf-8"))
            : { version: "0.0.0" };
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
