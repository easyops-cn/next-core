/**
 * - 拷贝 @next-core/brick-icons
 * - 生成 FontAwesome 图标数据以便使用 dynamic imports
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { copyFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Promises<unknown>[]} */
const tasks = [];

const legacyEasyOpsIconsPath = path.resolve(
  __dirname,
  "../../../packages/brick-icons/src/icons"
);
const newEasyOpsIconsPath = path.resolve(
  __dirname,
  "../src/easyops-icon/generated"
);
if (existsSync(newEasyOpsIconsPath)) {
  rmSync(newEasyOpsIconsPath, { recursive: true, force: true });
}
mkdirSync(newEasyOpsIconsPath);

const newDefaultCategoryDir = path.resolve(newEasyOpsIconsPath, "default");
mkdirSync(newDefaultCategoryDir);

tasks.push(
  readdir(legacyEasyOpsIconsPath, { withFileTypes: true }).then((list) =>
    Promise.all(
      list.map((item) => {
        // 目前验证阶段先只构建默认分类的图标，以便提升构建速率。
        if (
          process.env.ALL_ICONS &&
          item.isDirectory() &&
          /\w/.test(item.name)
        ) {
          const categoryDir = path.resolve(legacyEasyOpsIconsPath, item.name);
          const newCategoryDir = path.resolve(newEasyOpsIconsPath, item.name);
          mkdirSync(newCategoryDir);
          return readdir(categoryDir).then((icons) =>
            icons
              .filter((icon) => icon.endsWith(".svg"))
              .map((icon) =>
                copyFile(
                  path.resolve(categoryDir, icon),
                  path.resolve(newCategoryDir, icon)
                )
              )
          );
        } else if (item.name.endsWith(".svg")) {
          return copyFile(
            path.resolve(legacyEasyOpsIconsPath, item.name),
            path.resolve(newDefaultCategoryDir, item.name)
          );
        }
      })
    )
  )
);

const generatedDir = path.resolve(__dirname, "../src/fa-icon/generated");
if (existsSync(generatedDir)) {
  rmSync(generatedDir, { recursive: true, force: true });
}
mkdirSync(generatedDir);

const iconsDir = path.resolve(generatedDir, "icons");
mkdirSync(iconsDir);

const faSvgCorePackageJsonPath = require.resolve(
  "@fortawesome/fontawesome-svg-core/package.json"
);

tasks.push(
  copyFile(
    path.resolve(faSvgCorePackageJsonPath, "../styles.css"),
    path.resolve(generatedDir, "fa-icon.shadow.css")
  )
);

const iconCategories = {
  regular: far,
  // 目前验证阶段先只构建 Regular 分类的图标，以便提升构建速率。
  ...(process.env.ALL_ICONS && {
    solid: fas,
    brands: fab,
  }),
};
const aliasMapByCategory = {};

for (const category of Object.keys(iconCategories)) {
  mkdirSync(path.resolve(iconsDir, category));
}

for (const [category, pack] of Object.entries(iconCategories)) {
  const aliasMap = (aliasMapByCategory[category] = {});
  const copyIcons = Promise.all(
    Object.values(pack).flatMap((item) => {
      const aliases = item.icon[2].filter((alias) => typeof alias === "string");
      for (const alias of aliases) {
        aliasMap[alias] = item.iconName;
      }
      return writeFile(
        path.resolve(iconsDir, `${category}/${item.iconName}.json`),
        JSON.stringify(item)
      );
    })
  );

  tasks.push(copyIcons);
}

tasks.push(
  writeFile(
    path.resolve(generatedDir, "alias.json"),
    JSON.stringify(aliasMapByCategory)
  )
);

Promise.all(tasks).then(
  () => {
    console.log("Generate icon files done!");
  },
  (error) => {
    console.error("Generate icon files failed:", error);
  }
);
