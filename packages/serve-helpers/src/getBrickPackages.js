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

        const devEditorsJsonPath = path.join(
          bricksDir,
          dirName,
          "dist-property-editors/editors.json"
        );
        let v2DevEditorsJson;
        if (!bricksJson.id && existsSync(devEditorsJsonPath)) {
          v2DevEditorsJson = JSON.parse(
            await readFile(devEditorsJsonPath, "utf-8")
          );
        }

        if (publicRootWithVersion) {
          const packageJsonPath = path.join(bricksDir, dirName, "package.json");
          const packageJson = existsSync(packageJsonPath)
            ? JSON.parse(await readFile(packageJsonPath, "utf-8"))
            : { version: "0.0.0" };
          let { filePath } = bricksJson;
          if (!filePath) {
            // `filePath` is not set for some old brick/widget packages.
            const filesInDist = await readdir(
              path.join(bricksDir, dirName, "dist"),
              { withFileTypes: true }
            );
            const jsFile = filesInDist.find(
              (file) => file.isFile() && file.name.endsWith(".js")
            );
            if (!jsFile) {
              throw new Error(
                `"filePath" not found for brick package ${dirName}`
              );
            }
            filePath = `bricks/${dirName}/dist/${jsFile.name}`;
          }
          const updatedFilePath = filePath.replace(
            "/dist/",
            `/${packageJson.version}/dist/`
          );
          return {
            ...bricksJson,
            filePath: updatedFilePath,
          };
        }
        return patchV2DevEditors(bricksJson, v2DevEditorsJson);
      }
    )
  );
}

function patchV2DevEditors(bricksJson, v2DevEditorsJson) {
  if (v2DevEditorsJson) {
    return {
      ...bricksJson,
      ...v2DevEditorsJson,
      propertyEditorsJsFilePath:
        v2DevEditorsJson.propertyEditorsJsFilePath.replace(
          "/dist/property-editors/",
          "/dist-property-editors/"
        ),
    };
  }
  return bricksJson;
}
