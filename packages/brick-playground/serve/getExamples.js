import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import walk from "./walk.js";

/**
 *
 * @param {string} bricksDir
 * @returns {Promise<unknown[]>}
 */
export default async function getExamples(bricksDir) {
  if (!existsSync(bricksDir)) {
    return [];
  }

  const exampleTasks = [];
  const exampleMap = new Map();

  const parseExample = async (filePath, key) => {
    const content = await readFile(filePath, "utf-8");
    const mode = filePath.endsWith("yaml") ? "yaml" : "html";
    exampleMap.set(key, {
      mode,
      [mode]: content,
    });
  };

  const visitExamples = {
    file(absolutePath, stack) {
      if (stack.length >= 3) {
        const filename = stack[stack.length - 1];
        if (filename === "example.html" || filename === "example.yaml") {
          exampleTasks.push(
            parseExample(absolutePath, stack.slice(0, -1).join("/"))
          );
        }
      }
    },
  };

  const dirs = await readdir(bricksDir, {
    withFileTypes: true,
  });

  await Promise.all(
    dirs.map(async (dir) => {
      if (dir.isDirectory() || dir.isSymbolicLink()) {
        const srcPath = path.join(bricksDir, dir.name, "src");
        if (existsSync(srcPath)) {
          await walk(srcPath, visitExamples, [dir.name]);
        }
      }
    })
  );

  await Promise.all(exampleTasks);

  const exampleKeys = [...exampleMap.keys()].sort();
  return exampleKeys.map((key) => ({
    key,
    ...exampleMap.get(key),
  }));
}
