import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";

/**
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
export default async function getLocalBrickFolders(rootDir) {
  const dirs = await readdir(rootDir, { withFileTypes: true });
  return (
    await Promise.all(
      dirs
        .filter(
          (item) =>
            (item.isDirectory() || item.isSymbolicLink()) &&
            (item.name.startsWith("next-") || item.name === "brick-next")
        )
        .map(async (item) => {
          const dirPath = path.join(rootDir, item.name);
          const bricksPath = path.join(dirPath, "bricks");
          if (
            existsSync(bricksPath) &&
            (await stat(bricksPath)).isDirectory()
          ) {
            return bricksPath;
          }
        })
    )
  ).filter(Boolean);
}
