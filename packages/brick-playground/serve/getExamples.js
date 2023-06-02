import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import walk from "./walk.js";

const REGEX_EXAMPLES_IN_MARKDOWN =
  /(?:^###\s+(.+?)(?:\s+\{.*\})?\n[\s\S]*?)?^(```+)(html|yaml)(\s.*)?\n([\s\S]*?)\2/gm;

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
        const docsDir = path.join(bricksDir, dir.name, "docs");
        const examplesInMarkdown = await getExamplesInMarkdown(docsDir);
        /** @type {string | undefined} */
        let lastHeading;
        for (const item of examplesInMarkdown) {
          const stack = [dir.name, item.name];
          const heading = item.heading ?? lastHeading;
          lastHeading = heading;
          if (heading) {
            stack.push(heading.trim().toLowerCase());
          }
          const key = getDeduplicatedKey(stack.join("/"), exampleMap);
          exampleMap.set(key, {
            mode: item.mode,
            [item.mode]: item.code,
          });
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

/**
 * @param {string} docsDir
 */
async function getExamplesInMarkdown(docsDir) {
  if (!existsSync(docsDir)) {
    return [];
  }
  const docs = await readdir(docsDir);
  return (
    await Promise.all(
      docs.map(async (filename) => {
        const examplesInMarkdown = [];
        if (filename.endsWith(".md")) {
          const filePath = path.join(docsDir, filename);
          const content = await readFile(filePath, "utf-8");
          /** @type {null|(string | undefined)[]} */
          let matches;
          while (
            (matches = REGEX_EXAMPLES_IN_MARKDOWN.exec(content)) !== null
          ) {
            const [, heading, , mode, meta, code] = matches;
            const metaParts = meta.trim().split(/\s+/);
            if (metaParts.includes("preview")) {
              examplesInMarkdown.push({
                name: path.basename(filename, ".md").split(".").pop(),
                heading,
                mode,
                meta,
                code,
              });
            }
          }
        }
        return examplesInMarkdown;
      })
    )
  ).flat();
}

/**
 * @param {string} key
 * @param {Map<string, unknown>} map
 * @returns {string}
 */
function getDeduplicatedKey(key, map) {
  let count = 2;
  let cursor = key;
  while (map.has(cursor)) {
    cursor = `${key} (${count})`;
    count++;
  }
  return cursor;
}
