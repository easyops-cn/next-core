import fs from "fs";
import os from "os";
import path from "path";
import klawSync from "klaw-sync";
import * as changeCase from "change-case";

type FileWithContent = [string, string];

// `tsc` will compile files which `import` or `require`,
// thus, we read file content instead of importing.
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")
);
const devDependenciesCopyMap = {
  devDependencies: [
    "@easyops/babel-preset-next",
    "@easyops/brick-container",
    "@easyops/brick-scripts",
    "@easyops/browserslist-config-next",
    "@easyops/build-config-factory",
    "@easyops/eslint-config-next",
    "@easyops/webpack-config-factory"
  ],
  templateDependencies: ["@bricks/basic-bricks"]
};

function escapeRegExp(str: string): string {
  return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
}

function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function replaceFileContent(
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

function replaceDepsVersion(jsonString: string): string {
  const pkg = JSON.parse(jsonString);
  for (const [type, deps] of Object.entries(devDependenciesCopyMap)) {
    for (const dep of deps) {
      pkg.devDependencies[dep] = packageJson[type][dep];
    }
  }
  return JSON.stringify(pkg, null, 2) + os.EOL;
}

export function loadTemplate(
  repoName: string,
  targetDir: string,
  flags: { internal: boolean }
): FileWithContent[] {
  const templateDir = path.join(__dirname, "../../template");

  const ignores = [".DS_Store"];
  const filter = (src: string): boolean =>
    ignores.some(item => !src.includes(item));

  const templateFiles = klawSync(templateDir, {
    depthLimit: 3,
    nodir: true,
    filter: item => filter(item.path)
  });

  const translations: Record<string, string> = {
    "$kebab-repo-name$": changeCase.paramCase(repoName),
    "$Title Repo Name$": changeCase.capitalCase(repoName),
    "$generator.version$": `v${packageJson.version}`,
    "$easyops-registry$": flags.internal
      ? "http://registry.npm.easyops.local"
      : "http://r.pnpm.easyops.cn"
  };

  const files: FileWithContent[] = templateFiles.map(file => {
    const content = replaceFileContent(file.path, translations);
    return [
      path.join(targetDir, path.relative(templateDir, file.path)),
      content
    ];
  });

  files.push([
    path.join(targetDir, "package.json"),
    replaceDepsVersion(
      replaceFileContent(
        path.join(templateDir, "../template.json"),
        translations
      )
    )
  ]);

  return files;
}
