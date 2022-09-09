import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import klawSync from "klaw-sync";
import * as changeCase from "change-case";
import rp from "request-promise-native";
import { getEasyopsConfig } from "@next-core/repo-config";
import { FileWithContent, TargetType } from "../interface";

// `tsc` will compile files which `import` or `require`,
// thus, we read file content instead of importing.
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")
);
const { templateDependencies } = packageJson;
const brickContainerVersion =
  templateDependencies["@next-core/brick-container"];

const workspacePackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
);
const workspaceHomepage = workspacePackageJson.homepage;
const workspaceLicense = workspacePackageJson.license || "UNLICENSED";
let userName = "bot";
exec("git config user.name", { encoding: "utf8" }, function (err, value) {
  if (err) return;
  userName = value.trim();
});

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

export async function loadTemplate({
  targetType,
  packageName,
  brickName,
  processorName,
  targetRoot,
}: {
  targetType: TargetType;
  packageName: string;
  brickName: string;
  processorName: string;
  targetRoot: string;
}): Promise<FileWithContent[]> {
  const { useLocalSdk, usePublicScope } = getEasyopsConfig();

  const npmScopeOfBricks = usePublicScope ? "@next-bricks" : "@bricks";
  const npmScopeOfMicroApps = usePublicScope
    ? "@next-micro-apps"
    : "@micro-apps";
  const npmScopeOfTemplates = usePublicScope
    ? "@next-legacy-templates"
    : "@templates";
  const npmScopeOfLibs = usePublicScope ? "@next-libs" : "@libs";
  const npmScopeOfSdk = usePublicScope ? "@next-sdk" : "@sdk";
  const repoOrgUrl = usePublicScope
    ? "https://github.com/easyops-cn"
    : "https://git.easyops.local/anyclouds";
  const repoGitUrl = usePublicScope
    ? "github.com:easyops-cn"
    : "git.easyops.local:anyclouds";
  const npmRegistryUrl = usePublicScope
    ? "https://registry.npmjs.org"
    : "https://registry.npm.easyops.local";

  const targetMap: { [key: string]: string } = {
    [TargetType.A_NEW_BRICK]: "brick",
    [TargetType.A_NEW_CUSTOM_TEMPLATE]: "custom-template",
    [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "bricks-pkg",
    [TargetType.A_NEW_PACKAGE_OF_LIBS]: "libs-pkg",
    [TargetType.A_NEW_CUSTOM_PROVIDER]: "custom-provider",
    [TargetType.A_NEW_CUSTOM_PROCESSOR]: "custom-processor",
    [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "providers-pkg",
    [TargetType.A_NEW_PACKAGE_OF_DLL]: "dll-pkg",
  };
  const templateDirOfFileName = targetMap[targetType];
  const templateRoot = path.join(__dirname, "../../template");
  let templateDir = path.join(templateRoot, templateDirOfFileName);

  const ignores = [".DS_Store"];
  let sdkName: string;
  if (targetType === TargetType.A_NEW_PACKAGE_OF_PROVIDERS) {
    // Providers 库直接使用构件库的模板文件，但忽略其中部分文件。
    templateDir = path.join(
      templateRoot,
      targetMap[TargetType.A_NEW_PACKAGE_OF_BRICKS]
    );
    // Providers 库不需要 `src`。
    ignores.push("template/bricks-pkg/src/");
    sdkName = `${packageName.replace(/^providers-of-/, "")}-sdk`;
  }

  const translations: Record<string, string> = {
    "$npm-scope-of-bricks$": npmScopeOfBricks,
    "$npm-scope-of-micro-apps$": npmScopeOfMicroApps,
    "$npm-scope-of-templates$": npmScopeOfTemplates,
    "$npm-scope-of-libs$": npmScopeOfLibs,
    "$npm-scope-of-sdk$": npmScopeOfSdk,
    "$repo-org-url$": repoOrgUrl,
    "$repo-git-url$": repoGitUrl,
    "$workspace-homepage$": workspaceHomepage,
    "$kebab-package-name$": packageName,
    $PascalPackageName$: changeCase.pascalCase(packageName),
    "$Title Package Name$": changeCase.capitalCase(packageName),
    $CONSTANT_PACKAGE_NAME$: changeCase.constantCase(packageName),
    $camelCasePackageName$: changeCase.camelCase(packageName),
    $PascalBrickName$: changeCase.pascalCase(brickName),
    "$kebab-brick-name$": `${packageName}.${brickName}`,
    "$kebab-brick-last-name$": brickName,
    "$kebab-custom-provider-name$": `${packageName}.provider-${brickName}`,
    "$generator.version$": `v${packageJson.version}`,
    "$brick.container.version$": brickContainerVersion,
    "$kebab-sdk-name$": sdkName,
    "$kebab-username$": userName,
    $camelProcessorName$: changeCase.camelCase(processorName),
    "$open-source-license$": workspaceLicense,
    "$brick-package-type$":
      targetType === TargetType.A_NEW_PACKAGE_OF_PROVIDERS
        ? "providers"
        : "bricks",
  };

  const filter = (src: string): boolean =>
    ignores.every((item) => !src.includes(item));

  const templateGroups: any = [
    {
      templateDir,
      targetDir: targetRoot,
      files: klawSync(templateDir, {
        depthLimit: 4,
        nodir: true,
        filter: (item) => filter(item.path),
      }),
    },
  ];

  if (targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS && brickName) {
    // Also create a new brick for the new bricks-package
    const brickTemplateDir = path.join(templateRoot, "brick");
    templateGroups.push({
      templateDir: brickTemplateDir,
      targetDir: path.join(targetRoot, "src", brickName),
      files: klawSync(brickTemplateDir, {
        depthLimit: 2,
        nodir: true,
        filter: (item) => filter(item.path),
      }),
    });
  } else if (targetType === TargetType.A_NEW_PACKAGE_OF_PROVIDERS) {
    // Providers 库还有专属的一些模板文件。
    const brickTemplateDir = path.join(templateRoot, "providers-pkg");
    templateGroups.push({
      templateDir: brickTemplateDir,
      targetDir: targetRoot,
      files: klawSync(brickTemplateDir, {
        depthLimit: 2,
        nodir: true,
        filter: (item) => filter(item.path),
      }),
    });

    let sdkVersion = "1.0.0";
    const getVersion = async () => {
      try {
        const sdkPackage = await rp({
          url: `${npmRegistryUrl}/${npmScopeOfSdk}/${sdkName}`,
          json: true,
          strictSSL: false,
        });
        sdkVersion = `^${sdkPackage["dist-tags"].latest}`;
      } catch {
        sdkVersion = "FETCH LATEST VERSION ERROR";
      }
    };

    if (!useLocalSdk) {
      await getVersion();
    } else {
      const sdkPackagePath = path.resolve(
        targetRoot,
        "..",
        "..",
        "sdk",
        sdkName,
        "package.json"
      );
      if (fs.existsSync(sdkPackagePath)) {
        sdkVersion = JSON.parse(
          fs.readFileSync(sdkPackagePath, "utf8")
        ).version;
      }
    }

    translations["$sdk.version$"] = sdkVersion;
  }

  const files: FileWithContent[] = templateGroups.reduce(
    (acc: FileWithContent[], group: any) =>
      acc.concat(
        group.files.map((file: any) => {
          const content = replaceFileContent(file.path, translations);

          let realPath = file.path;
          const basename = path.basename(file.path);
          const filenameFinds = Object.keys(translations).filter((key) =>
            basename.includes(key)
          );
          if (filenameFinds.length > 0) {
            realPath = path.join(
              path.dirname(realPath),
              filenameFinds.reduce(
                (acc, find) => replaceAll(acc, find, translations[find]),
                basename
              )
            );
          }

          return [
            path.join(
              group.targetDir,
              path.relative(group.templateDir, realPath)
            ),
            content,
          ];
        })
      ),
    []
  );

  if (
    [
      TargetType.A_NEW_PACKAGE_OF_BRICKS,
      TargetType.A_NEW_PACKAGE_OF_LIBS,
      TargetType.A_NEW_PACKAGE_OF_PROVIDERS,
      TargetType.A_NEW_PACKAGE_OF_DLL,
    ].includes(targetType)
  ) {
    files.push([
      path.join(targetRoot, "package.json"),
      replaceFileContent(
        path.join(templateRoot, `${targetMap[targetType]}.json`),
        translations
      ),
    ]);
  }

  return files;
}
