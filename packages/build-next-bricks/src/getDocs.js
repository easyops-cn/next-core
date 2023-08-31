import {
  extractExamplesInMarkdown,
  htmlToYaml,
  yamlToHtml,
  htmlTagEntity,
} from "@next-core/doc-helpers";

const YAML_DELIMITER = "# -- YAML DELIMITER (1nbbm8) --";
const HTML_DELIMITER_START = "<!-- HTML DELIMITER start (1nbbm8) --";
const HTML_DELIMITER_END = "-- HTML DELIMITER end (1nbbm8) -->";

/**
 * @param {string} markdown
 * @param {import("@next-core/brick-manifest").PackageManifest[]} manifests
 */
export function handleExamplesInMarkdown(markdown, manifests) {
  const examples = extractExamplesInMarkdown(markdown, "");
  let cursor = 0;
  const chunks = [];
  for (const example of examples) {
    const nextCursor = example.codeIndex + example.code.length;
    chunks.push(markdown.substring(cursor, nextCursor));
    if (example.mode === "yaml") {
      const html = yamlToHtml(example.code, manifests);
      chunks.push(
        `${YAML_DELIMITER}\n`,
        html
          .split("\n")
          .map((line) => `# ${line}`)
          .join("\n"),
        "\n"
      );
    } else {
      const yaml = htmlToYaml(example.code, manifests);
      chunks.push(
        `${HTML_DELIMITER_START}\n`,
        htmlTagEntity(yaml),
        `\n${HTML_DELIMITER_END}\n`
      );
    }
    cursor = nextCursor;
  }
  chunks.push(markdown.substring(cursor));
  return chunks.join("");
}
