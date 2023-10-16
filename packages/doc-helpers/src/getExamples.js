// @ts-check
import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import walk from "./walk.js";
import htmlToYaml from "./htmlToYaml.js";
import yamlToHtml from "./yamlToHtml.js";
import extractExamplesInMarkdown from "./extractExamplesInMarkdown.js";

/**
 * @typedef {import("@next-core/doc-helpers").Example} Example
 * @typedef {import("@next-core/brick-manifest").PackageManifest} PackageManifest
 */

/**
 *
 * @param {string} bricksDir
 * @param {PackageManifest[]} manifests
 * @returns {Promise<unknown[]>}
 */
export default async function getExamples(bricksDir, manifests) {
  if (!existsSync(bricksDir)) {
    return [];
  }

  /** @type {Promise<unknown>[]} */
  const exampleTasks = [];
  /** @type {Map<string, Partial<Example>>} */
  const exampleMap = new Map();

  /**
   * @param {string} filePath
   * @param {string} key
   */
  const parseExample = async (filePath, key) => {
    const content = await readFile(filePath, "utf-8");
    const isYaml = filePath.endsWith("yaml");
    const mode = isYaml ? "yaml" : "html";
    /** @type {Partial<Example>} */
    const example = {
      mode,
      [mode]: content,
    };
    if (isYaml) {
      example.html = await yamlToHtml(content, manifests);
    } else {
      example.yaml = htmlToYaml(content, manifests);
    }
    exampleMap.set(key, example);
  };

  const visitExamples = {
    /**
     * @param {string} absolutePath
     * @param {string[]} stack
     */
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
        for (const item of examplesInMarkdown) {
          const stack = [dir.name, item.name];
          if (item.heading) {
            stack.push(item.heading.trim().toLowerCase());
          }
          const key = getDeduplicatedKey(stack.join("/"), exampleMap);
          /** @type {Partial<Example>} */
          const example = {
            mode: item.mode,
            [item.mode]: item.code,
          };
          if (item.mode === "yaml") {
            example.html = await yamlToHtml(item.code, manifests ?? []);
          } else {
            example.yaml = htmlToYaml(item.code, manifests ?? []);
          }
          // Create a gap between inline elements (by inserting a hidden style tag)
          example.gap = item.meta?.trim().includes("gap");
          exampleMap.set(key, example);
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
        if (!filename.endsWith(".md")) {
          return [];
        }
        const filePath = path.join(docsDir, filename);
        const markdown = await readFile(filePath, "utf-8");
        const examples = extractExamplesInMarkdown(
          markdown,
          path.basename(filename, ".md").split(".").pop()
        );

        /** @type {string | undefined} */
        let lastHeading;
        return examples.map((item) => {
          const heading = item.heading ?? lastHeading;
          lastHeading = heading;
          return {
            ...item,
            heading,
          };
        });
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
