// @ts-check

/**
 * @typedef {import("@next-core/doc-helpers").MarkdownExample} MarkdownExample
 */

const REGEX_EXAMPLES_IN_MARKDOWN =
  /(?<leading>(?:^###\s+(?<heading>.+?)(?:\s+\{.*\})?\n[\s\S]*?)?^(```+)(?<mode>html|yaml)(?<meta>\s.*)?\n)(?<code>[\s\S]*?)\3/gm;

/**
 * @param {string} markdown
 * @param {string} name
 * @returns {MarkdownExample[]}
 */
export default function extractExamplesInMarkdown(markdown, name) {
  /** @type {MarkdownExample[]} */
  const examplesInMarkdown = [];
  /** @type {null|RegExpExecArray} */
  let matches;
  while ((matches = REGEX_EXAMPLES_IN_MARKDOWN.exec(markdown)) !== null) {
    const { leading, heading, mode, meta, code } = matches.groups;
    const metaParts = meta.trim().split(/\s+/);
    if (metaParts.includes("preview")) {
      examplesInMarkdown.push({
        name,
        heading,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mode,
        meta,
        code,
        codeIndex: matches.index + leading.length,
      });
    }
  }
  return examplesInMarkdown;
}
