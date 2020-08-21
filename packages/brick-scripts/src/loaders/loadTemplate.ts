import fs from "fs-extra";
import os from "os";
import path from "path";
import klawSync from "klaw-sync";
import * as changeCase from "change-case";
import rp from "request-promise-native";
import { FileWithContent, TargetType } from "../interface";
import { getEasyopsConfig } from "../getEasyopsConfig";
const { exec } = require("child_process");
// `tsc` will compile files which `import` or `require`,
// thus, we read file content instead of importing.
const easyopsConfig = getEasyopsConfig();
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")
);
const { templateDependencies } = packageJson;
const basicBricksVersion = templateDependencies["@bricks/basic-bricks"];
const brickContainerVersion = templateDependencies["@easyops/brick-container"];

const workspacePackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
);
const workspaceHomepage = workspacePackageJson.homepage;
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

function replaceDepsVersion(jsonString: string): string {
  const pkg = JSON.parse(jsonString);

  const peerDeps = pkg.peerDependencies || {};
  if (peerDeps["@bricks/basic-bricks"]) {
    peerDeps["@bricks/basic-bricks"] = basicBricksVersion;
  }
  return JSON.stringify(pkg, null, 2) + os.EOL;
}

export async function loadTemplate({
  targetType,
  packageName,
  brickName,
  templateName,
  processorName,
  targetRoot,
  docRoot,
}: {
  targetType: TargetType;
  packageName: string;
  brickName: string;
  templateName: string;
  processorName: string;
  targetRoot: string;
  docRoot: string;
}): Promise<FileWithContent[]> {
  const targetMap: { [key: string]: string } = {
    [TargetType.A_NEW_BRICK]: "brick",
    [TargetType.A_NEW_CUSTOM_TEMPLATE]: "custom-template",
    [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "bricks-pkg",
    [TargetType.A_NEW_PACKAGE_OF_LIBS]: "libs-pkg",
    [TargetType.A_NEW_PACKAGE_OF_MICRO_APPS]: "micro-apps-pkg",
    [TargetType.A_NEW_CUSTOM_PROVIDER_BRICK]: "custom-provider-brick",
    [TargetType.A_NEW_CUSTOM_PROCESSOR]: "custom-processor",
    [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "providers-pkg",
    [TargetType.A_NEW_PACKAGE_OF_DLL]: "dll-pkg",
    [TargetType.TRANSFORM_A_MICRO_APP]: "transformed-micro-apps-pkg",
    [TargetType.A_NEW_LEGACY_TEMPLATE]: "template",
    [TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES]: "templates-pkg",
    [TargetType.I18N_PATCH_A_PACKAGE_OF_LEGACY_TEMPLATES]:
      "i18n-patched-templates-pkg",
  };
  const templateDirOfFileName = targetMap[targetType];
  const templateRoot = path.join(__dirname, "../../template");
  let templateDir = path.join(templateRoot, templateDirOfFileName);

  const ignores = [".DS_Store"];
  let sdkName: string;
  if (targetType === TargetType.A_NEW_PACKAGE_OF_PROVIDERS) {
    // Providers 库直接使用构件库的模板文件，但忽略其 `src` 目录。
    templateDir = path.join(
      templateRoot,
      targetMap[TargetType.A_NEW_PACKAGE_OF_BRICKS]
    );
    ignores.push("template/bricks-pkg/src/");
    sdkName = `${packageName.replace(/^providers-of-/, "")}-sdk`;
  }

  const translations: Record<string, string> = {
    "$workspace-homepage$": workspaceHomepage,
    "$kebab-package-name$": packageName,
    $PascalPackageName$: changeCase.pascalCase(packageName),
    "$Title Package Name$": changeCase.capitalCase(packageName),
    $CONSTANT_PACKAGE_NAME$: changeCase.constantCase(packageName),
    $camelCasePackageName$: changeCase.camelCase(packageName),
    $PascalBrickName$: changeCase.pascalCase(brickName),
    "$kebab-brick-name$": `${packageName}.${brickName}`,
    "$kebab-brick-last-name$": brickName,
    "$kebab-custom-provider-brick-name$": `${packageName}.provider-${brickName}`,
    "$generator.version$": `v${packageJson.version}`,
    "$brick.container.version$": brickContainerVersion,
    "$kebab-sdk-name$": sdkName,
    "$kebab-template-name$": templateName,
    "$kebab-username$": userName,
    $camelTemplateName$: changeCase.camelCase(templateName),
    $PascalTemplateName$: changeCase.pascalCase(templateName),
    $camelProcessorName$: changeCase.camelCase(processorName),
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
  } else if (targetType === TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES) {
    // Also create a new brick for the new bricks-package
    const templateTemplateDir = path.join(templateRoot, "template");
    templateGroups.push({
      templateDir: templateTemplateDir,
      targetDir: path.join(targetRoot, "src"),
      files: klawSync(templateTemplateDir, {
        depthLimit: 1,
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

    let sdkVersion;
    const getVersion = async () => {
      try {
        const sdkPackage = await rp({
          url: `https://registry.npm.easyops.local/@sdk/${sdkName}`,
          json: true,
          strictSSL: false,
        });
        sdkVersion = `^${sdkPackage["dist-tags"].latest}`;
      } catch {
        sdkVersion = "FETCH LATEST VERSION ERROR";
      }
      translations["$sdk.version$"] = sdkVersion;
    };

    if (!easyopsConfig?.useLocalSdk) {
      await getVersion();
    } else {
      translations["$sdk.version$"] = "1.0.0";
    }
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
    targetType !== TargetType.A_NEW_BRICK &&
    targetType !== TargetType.A_NEW_CUSTOM_TEMPLATE &&
    targetType !== TargetType.A_NEW_CUSTOM_PROVIDER_BRICK &&
    targetType !== TargetType.A_NEW_CUSTOM_PROCESSOR &&
    targetType !== TargetType.A_NEW_LEGACY_TEMPLATE &&
    targetType !== TargetType.TRANSFORM_A_MICRO_APP &&
    targetType !== TargetType.I18N_PATCH_A_PACKAGE_OF_LEGACY_TEMPLATES
  ) {
    files.push([
      path.join(targetRoot, "package.json"),
      replaceDepsVersion(
        replaceFileContent(
          path.join(templateRoot, `${targetMap[targetType]}.json`),
          translations
        )
      ),
    ]);
  }

  return files;
}
