import path from "path";
import klawSync from "klaw-sync";
import * as changeCase from "change-case";
import {
  getPackageJson,
  replaceFileContent,
  replaceDepsVersion,
} from "../utils";

type FileWithContent = [string, string];

export function loadTemplate(
  repoName: string,
  targetDir: string,
  { internal }: { internal?: boolean }
): FileWithContent[] {
  const packageJson = getPackageJson();
  const templateDir = path.join(__dirname, "../../template");

  const ignores = [".DS_Store"];
  const filter = (src: string): boolean =>
    ignores.some((item) => !src.includes(item));

  const templateFiles = klawSync(templateDir, {
    depthLimit: 3,
    nodir: true,
    filter: (item) => filter(item.path),
  });

  const translations: Record<string, string> = {
    "$npm-scope-of-bricks$": internal ? "@bricks" : "@next-bricks",
    "$npm-scope-of-micro-apps$": internal ? "@micro-apps" : "@next-micro-apps",
    "$npm-scope-of-templates$": internal
      ? "@templates"
      : "@next-legacy-templates",
    "$npm-scope-of-libs$": internal ? "@libs" : "@next-libs",
    "$npm-registry$": internal
      ? "https://registry.npm.easyops.local"
      : "https://registry.npmjs.org",
    "$repo-org-url$": internal
      ? "https://git.easyops.local/anyclouds"
      : "https://github.com/easyops-cn",
    "$kebab-repo-name$": changeCase.paramCase(repoName),
    "$Title Repo Name$": changeCase.capitalCase(repoName),
    "$generator.version$": `v${packageJson.version}`,
    "$easyops-registry$": "http://registry.npm.easyops.local",
  };

  const files: FileWithContent[] = templateFiles.map((file) => {
    const content = replaceFileContent(file.path, translations);
    return [
      path.join(targetDir, path.relative(templateDir, file.path)),
      content,
    ];
  });

  files.push([
    path.join(targetDir, "package.json"),
    replaceDepsVersion(
      replaceFileContent(
        path.join(templateDir, "../template.json"),
        translations
      ),
      packageJson
    ),
  ]);

  return files;
}
