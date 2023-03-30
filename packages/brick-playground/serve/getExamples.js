import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { parse } from "node-html-parser";
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

  const parseHtmlExample = async (filePath, key) => {
    const content = await readFile(filePath, "utf-8");
    const html = parse(content);

    const scripts = html.querySelectorAll("script");
    const jsContent = scripts.map((script) => script.text).join("\n\n");

    scripts.forEach((script) => {
      script.remove();
    });

    const htmlContent = html.querySelector("body")?.innerHTML ?? "";

    exampleMap.set(key, {
      mode: "html",
      html: trimLeadingSpaces(htmlContent),
      javascript: trimLeadingSpaces(jsContent),
    });
  };

  const parseYamlExample = async (filePath, key) => {
    const content = await readFile(filePath, "utf-8");
    exampleMap.set(key, {
      mode: "yaml",
      yaml: content,
    });
  };

  const visitExamples = {
    file(absolutePath, stack) {
      if (stack.length >= 3) {
        const filename = stack[stack.length - 1];
        if (filename === "example.html") {
          exampleTasks.push(
            parseHtmlExample(absolutePath, stack.slice(0, -1).join("/"))
          );
        } else if (filename === "example.yaml") {
          exampleTasks.push(
            parseYamlExample(absolutePath, stack.slice(0, -1).join("/"))
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

/**
 * @param {string} str
 * @returns {string}
 */
function trimLeadingSpaces(str) {
  const lines = str.split("\n");
  let mostCommonLeadingSpaces = 0;
  for (const line of lines) {
    if (!/^\s*$/.test(line)) {
      const leadingSpaces = line.match(/^ */)[0].length;
      if (
        mostCommonLeadingSpaces === 0 ||
        leadingSpaces < mostCommonLeadingSpaces
      ) {
        mostCommonLeadingSpaces = leadingSpaces;
      }
    }
  }
  if (mostCommonLeadingSpaces > 0) {
    return lines
      .map((line) => line.slice(mostCommonLeadingSpaces))
      .join("\n")
      .trim();
  }
  return str.trimEnd();
}
