import fs from "fs";
import os from "os";
import path from "path";
import klawSync from "klaw-sync";
import changeCase from "change-case";
import { FileWithContent } from "../interface";

// `tsc` will compile files which `import` or `require`,
// thus, we read file content instead of importing.
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")
);
const { devDependencies } = packageJson;
const brickHttpVersion = devDependencies["@easyops/brick-http"];
const rollupConfigFactoryVersion =
  devDependencies["@easyops/rollup-config-factory"];

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

function replaceDepsVersion(jsonString: string, sdkVersion: string): string {
  const pkg = JSON.parse(jsonString);
  pkg.devDependencies["@easyops/brick-http"] = brickHttpVersion;
  pkg.devDependencies[
    "@easyops/rollup-config-factory"
  ] = rollupConfigFactoryVersion;
  if (sdkVersion) {
    pkg.version = sdkVersion;
  }
  return JSON.stringify(pkg, null, 2) + os.EOL;
}

export function loadTemplate(
  serviceName: string,
  sdkRoot: string,
  sdkVersion: string
): FileWithContent[] {
  const templateDir = path.join(__dirname, "../../template");

  const ignores = [".DS_Store"];
  const filter = (src: string): boolean =>
    ignores.some(item => !src.includes(item));

  const templateFiles = klawSync(templateDir, {
    depthLimit: 2,
    nodir: true,
    filter: item => filter(item.path)
  });

  const translations: Record<string, string> = {
    "$kebab-service-name$": changeCase.kebab(serviceName),
    "$Title Service Name$": changeCase.title(serviceName),
    $PascalServiceName$: changeCase.pascal(serviceName),
    "$generator.version$": `v${packageJson.version}`
  };

  const files: FileWithContent[] = templateFiles.map(file => {
    const content = replaceFileContent(file.path, translations);
    return [path.join(sdkRoot, path.relative(templateDir, file.path)), content];
  });

  files.push([
    path.join(sdkRoot, "package.json"),
    replaceDepsVersion(
      replaceFileContent(
        path.join(templateDir, "../template.json"),
        translations
      ),
      sdkVersion
    )
  ]);

  return files;
}
