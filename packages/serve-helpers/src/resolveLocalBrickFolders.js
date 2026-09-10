import path from "node:path";
import glob from "glob";

/**
 * @param {string} rootDir
 * @param {string[]} brickFolders
 * @returns {Promise<string[]>}
 */
export async function resolveLocalBrickFolders(rootDir, brickFolders) {
  return (
    await Promise.all(
      brickFolders.map(
        (folder) =>
          new Promise((resolve, reject) => {
            glob(
              path.resolve(rootDir, folder),
              { windowsPathsNoEscape: true },
              (err, matches) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(matches);
                }
              }
            );
          })
      )
    )
  ).flat();
}
