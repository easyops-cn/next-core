function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const variableMap = {
  "table-header-sort-active-bg": true,
  "table-header-filter-active-bg": true,
  "table-header-sort-active-filter-bg": true,
  "pagination-item-disabled-bg-active": true,
};

const rawStringMap = {
  "fade(@calendar-item-active-bg, 20%)": "var(--antd-column-active-bg)",
  "darken(@item-active-bg, 2%)": "var(--antd-item-active-bg-darken-2)",
  "shade(@text-color-secondary, 40%)":
    "var(--antd-text-color-secondary-shade-40)",
  "fade(@disabled-color, 10%)": "var(--antd-disabled-color-fade-10)",
  "lighten(@border-color-split, 80%)":
    "var(--antd-border-color-split-lighten-80)",
};

const replacements = [
  [
    new RegExp(
      `(?:@(${Object.keys(variableMap).map(escapeRegExp).join("|")})):[^;]+;`,
      "g"
    ),
    (match, p1) => {
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

class LessReplacer {
  process(src) {
    return replacements.reduce(
      (source, item) => source.replace(item[0], item[1]),
      src
    );
  }
}

exports.LessReplacer = LessReplacer;
