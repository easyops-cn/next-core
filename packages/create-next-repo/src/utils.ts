// File System, hard to test for now.
/* istanbul ignore file */
import fs from "fs";
import path from "path";
import prettier from "prettier";

// `tsc` will compile files which `import` or `require`,
// thus, we read file content instead of importing.
export function getPackageJson(): Record<string, any> {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
  );
}

export const devDependenciesCopyMap = {
  devDependencies: [
    "@dll/ace",
    "@dll/d3",
    "@dll/echarts",
    "@easyops/babel-preset-next",
    "@easyops/brick-container",
    "@easyops/brick-dll",
    "@easyops/brick-scripts",
    "@easyops/brick-types",
    "@easyops/browserslist-config-next",
    "@easyops/build-config-factory",
    "@easyops/eslint-config-next",
    "@easyops/webpack-config-factory"
  ],
  templateDependencies: ["@bricks/basic-bricks"]
};

export function escapeRegExp(str: string): string {
  return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
}

export function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

export function replaceFileContent(
  filePath: string,
  translations: Record<string, string>
): string {
  const content = fs.readFileSync(filePath, "utf8");
  const contentFinds = Object.keys(translations).filter(key =>
    content.includes(key)
  );
  if (contentFinds.length > 0) {
    return contentFinds.reduce(
      (acc, find) => replaceAll(acc, find, translations[find]),
      content
    );
  }
  return content;
}

export function replaceDepsVersion(
  jsonString: string,
  packageJson: Record<string, any>
): string {
  const pkg = JSON.parse(jsonString);
  for (const [type, deps] of Object.entries(devDependenciesCopyMap)) {
    for (const dep of deps) {
      pkg.devDependencies[dep] = packageJson[type][dep];
    }
  }
  pkg.easyops["create-next-repo"] = packageJson.version;
  return prettier.format(JSON.stringify(pkg), { parser: "json" });
}
