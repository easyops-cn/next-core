const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const klawSync = require("klaw-sync");
const changeCase = require("change-case");
const prettier = require("prettier");
const _ = require("lodash");

const sharedIconsDir = path.join(
  require.resolve("@next-shared/icons/package.json"),
  "../src/icons"
);
const iconsDir = path.join(process.cwd(), "src/icons");

fs.copySync(sharedIconsDir, iconsDir);

const flattenIcons = klawSync(iconsDir, {
  depthLimit: 2,
  nodir: true,
  filter: (item) => item.path.endsWith(".svg"),
  traverseAll: true,
}).map((item) => {
  const relativePath = path
    .relative(iconsDir, item.path)
    .split(path.sep)
    .join("/");
  const basename = path.basename(relativePath, ".svg");
  const category = relativePath.includes("/")
    ? relativePath.split("/")[0]
    : "default";
  return { category, relativePath, basename };
});

const groupedIcons = Object.entries(_.groupBy(flattenIcons, "category"));

for (const [category, icons] of groupedIcons) {
  const imports = icons.map(
    (icon) =>
      `import ${changeCase.pascalCase(category)}${changeCase.pascalCase(
        icon.basename
      )} from "../../icons/${icon.relativePath}";`
  );
  const exports = `export const ${changeCase.camelCase(category)}Category = {
    ${icons
      .map(
        (icon) =>
          `  "${changeCase.paramCase(icon.basename)}": ${changeCase.pascalCase(
            category
          )}${changeCase.pascalCase(icon.basename)},`
      )
      .join(os.EOL)}
  };`;
  const content = imports.concat(exports).join(os.EOL);

  const categoryTsPath = path.join(
    process.cwd(),
    "src/generated/icons",
    `${category}.ts`
  );
  fs.outputFileSync(
    categoryTsPath,
    prettier.format(content, { parser: "typescript" })
  );
}

const content = `export default {
    ${groupedIcons
      .map(
        ([category]) =>
          `"${category}": async () => (await import(/* webpackChunkName: "icons--${category}" */ "./icons/${category}")).${
            changeCase.camelCase(category) + "Category"
          }`
      )
      .join(",")}
  } as Record<string, () => Promise<Record<string, SvgrComponent>>>;`;

const categoriesTsPath = path.join(
  process.cwd(),
  "src/generated/categories.ts"
);
fs.outputFileSync(
  categoriesTsPath,
  prettier.format(content, { parser: "typescript" })
);

let mapContent = {};
groupedIcons.forEach(([category, icons]) => {
  mapContent[category] = icons.map((icon) => icon.basename);
});
mapContent = `export const iconsByCategory = ${JSON.stringify(mapContent)}`;
const iconsByCategory = path.join(
  process.cwd(),
  "src/generated/iconsByCategory.ts"
);
fs.outputFileSync(
  iconsByCategory,
  prettier.format(mapContent, { parser: "typescript" })
);
