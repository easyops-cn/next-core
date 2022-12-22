// @ts-check
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} dirname
 * @param {string} filename
 */
export default function findFileUpward(dirname, filename) {
  const dir = path.resolve(dirname).split(path.sep);
  while (dir.length > 0) {
    const filePath = path.join(dir.join(path.sep), filename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    dir.pop();
  }
  throw new Error(
    `File not found for '${filename}' upward the directory '${dirname}'`
  );
}
