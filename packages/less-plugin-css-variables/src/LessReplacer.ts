function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Replacer = (substring: string, ...args: any[]) => string;

const variableMap = {
  "table-header-sort-active-bg": true,
  "table-header-filter-active-bg": true,
  "table-header-sort-active-filter-bg": true,
  "pagination-item-disabled-bg-active": true,
};

const rawStringMap = {
  "fade(@calendar-item-active-bg, 20%)": "var(--antd-column-active-bg)",
  "darken(@item-active-bg, 2%)": "var(--antd-item-active-bg-darken-2)",
};

const replacements: [RegExp, Replacer][] = [
  [
    new RegExp(
      `(?:@(${Object.keys(variableMap).map(escapeRegExp).join("|")})):[^;]+;`,
      "g"
    ),
    (match, p1: string) => {
      return `@${p1}: var(--antd-${p1});`;
    },
  ],
  [
    new RegExp(`${Object.keys(rawStringMap).map(escapeRegExp).join("|")}`, "g"),
    (match) => {
      return rawStringMap[match];
    },
  ],
];

export class LessReplacer {
  process(src: string): string {
    return replacements.reduce(
      (source, item) => source.replace(item[0], item[1]),
      src
    );
  }
}
