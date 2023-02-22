import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import klawSync from "klaw-sync";
import * as changeCase from "change-case";
import { getEasyopsConfig } from "@next-core/repo-config";
import { FileWithContent } from "../interface.js";
import __dirname from "./__dirname.js";

// `tsc` will compile files which `import` or `require`,
// thus, we read file content instead of importing.
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")
);

const workspacePackageJson = JSON.parse(
  fs.readFileSync(
    path.join(
      process.env.NODE_ENV === "test"
        ? path.join(__dirname, "../../../..")
        : process.cwd(),
      "package.json"
    ),
    "utf8"
  )
);

const workspaceHomepage = workspacePackageJson.homepage;
const workspaceLicense = workspacePackageJson.license || "UNLICENSED";

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
  const contentFinds = Object.keys(translations).filter((key) =>
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
  const { usePublicScope } = getEasyopsConfig();

  const templateDir = path.join(__dirname, "../../template");

  const ignores = [".DS_Store"];
  const filter = (src: string): boolean =>
    ignores.some((item) => !src.includes(item));

  const templateFiles = klawSync(templateDir, {
    depthLimit: 2,
    nodir: true,
    filter: (item) => filter(item.path),
  });

  const translations: Record<string, string> = {
    "$npm-scope-of-sdk$": usePublicScope ? "@next-api-sdk" : "@api-sdk",
    "$workspace-homepage$": workspaceHomepage,
    "$kebab-service-name$": changeCase.paramCase(serviceName),
    "$Title Service Name$": changeCase.capitalCase(serviceName),
    $PascalServiceName$: changeCase.pascalCase(serviceName),
    "$generator.version$": `v${packageJson.version}`,
    "$open-source-license$": workspaceLicense,
  };

  const files: FileWithContent[] = templateFiles.map((file) => {
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
    ),
  ]);

  return files;
}
