import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * @typedef {(absolutePath: string, stack: string[]) => unknown} VisitFn
 */

/**
 * @param {string} dir
 * @param {{ file?: VisitFn; directory?: VisitFn }} visits
 * @param {string[]} stack
 */
export default async function walk(dir, visits, stack = []) {
  const list = await readdir(dir, {
    withFileTypes: true,
  });
  await Promise.all(
    list.map(async (item) => {
      const absolutePath = path.join(dir, item.name);
      const nextStack = stack.concat(item.name);
      if (item.isDirectory()) {
        if (visits.directory?.(absolutePath, nextStack) !== false) {
          await walk(absolutePath, visits, nextStack);
        }
      } else if (item.isFile()) {
        visits.file?.(absolutePath, nextStack);
      }
    })
  );
}
