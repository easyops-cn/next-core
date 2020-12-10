const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const klawSync = require("klaw-sync");
const changeCase = require("change-case");
const prettier = require("prettier");
const _ = require("lodash");

const imagesDir = path.join(process.cwd(), "src/images");

const flattenImages = klawSync(imagesDir, {
  depthLimit: 2,
  nodir: true,
  filter: (item) => item.path.endsWith(".png"),
  traverseAll: true,
}).map((item) => {
  const relativePath = path
    .relative(imagesDir, item.path)
    .split(path.sep)
    .join("/");

  const basename = path.basename(relativePath, ".png");
  const category = relativePath.includes("/")
    ? relativePath.split("/")[0]
    : "default";

  const lowerKebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
  if (!(lowerKebabCase.test(category) && lowerKebabCase.test(basename))) {
    throw new Error(
      `Illustrations category and filename should always be in lower-kebab-case: ${category}/${basename}`
    );
  }
  return { category, relativePath, basename };
});

const groupedImages = Object.entries(_.groupBy(flattenImages, "category"));

const content = [
  ...groupedImages.map(([category, icons]) => {
    return icons
      .map((icon) => {
        return `import ${changeCase.pascalCase(
          category
        )}${changeCase.pascalCase(icon.basename)} from "./images/${
          icon.relativePath
        }";`;
      })
      .join(os.EOL);
  }),
  ...groupedImages.map(([category, icons]) => {
    return `export const ${changeCase.camelCase(category)}Category = {
      ${icons
        .map(
          (icon) =>
            `"${changeCase.paramCase(icon.basename)}": ${changeCase.pascalCase(
              category
            )}${changeCase.pascalCase(icon.basename)},`
        )
        .join(os.EOL)}
    };`;
  }),
  `export default {
    ${groupedImages
      .map(
        ([category]) =>
          `"${changeCase.paramCase(category)}": ${
            changeCase.camelCase(category) + "Category"
          }`
      )
      .join(",")}
  };`,
].join(os.EOL + os.EOL);

const indexTsPath = path.join(process.cwd(), "src/categories.ts");
fs.outputFileSync(
  indexTsPath,
  prettier.format(content, { parser: "typescript" })
);

let mapContent = {};
groupedImages.forEach(([category, icons]) => {
  mapContent[category] = icons.map((icon) => icon.basename);
});
mapContent = `export const illustrationsByCategory = ${JSON.stringify(
  mapContent
)}`;
const illustrationsByCategory = path.join(
  process.cwd(),
  "src/illustrationsByCategory.ts"
);
fs.outputFileSync(
  illustrationsByCategory,
  prettier.format(mapContent, { parser: "typescript" })
);
