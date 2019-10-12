import fs from "fs";
import os from "os";
import path from "path";
import klawSync from "klaw-sync";
import changeCase from "change-case";
import rp from "request-promise-native";
import { FileWithContent, TargetType } from "../interface";

// `tsc` will compile files which `import` or `require`,
// thus, we read file content instead of importing.
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")
);
const { templateDependencies, devDependencies } = packageJson;
const brickDllVersion = devDependencies["@easyops/brick-dll"];
const basicBricksVersion = templateDependencies["@bricks/basic-bricks"];
const brickContainerVersion = templateDependencies["@easyops/brick-container"];

const workspacePackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
);
const workspaceHomepage = workspacePackageJson.homepage;

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
  const devDeps = pkg.devDependencies || {};
  for (const key of Object.keys(devDeps)) {
    if (key === "@easyops/brick-dll") {
      devDeps[key] = brickDllVersion;
    }
  }

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
  targetRoot,
  docRoot
}: {
  targetType: TargetType;
  packageName: string;
  brickName: string;
  targetRoot: string;
  docRoot: string;
}): Promise<FileWithContent[]> {
  const targetMap: { [key: string]: string } = {
    [TargetType.A_NEW_BRICK]: "brick",
    [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "bricks-pkg",
    [TargetType.A_NEW_PACKAGE_OF_LIBS]: "libs-pkg",
    [TargetType.A_NEW_PACKAGE_OF_MICRO_APPS]: "micro-apps-pkg",
    [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "providers-pkg",
    [TargetType.A_NEW_PACKAGE_OF_DLL]: "dll-pkg",
    [TargetType.TRANSFORM_A_MICRO_APP]: "transformed-micro-apps-pkg"
  };
  const templateName = targetMap[targetType];
  const templateRoot = path.join(__dirname, "../../template");
  let templateDir = path.join(templateRoot, templateName);

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
    $PascalPackageName$: changeCase.pascal(packageName),
    "$Title Package Name$": changeCase.title(packageName),
    $CONSTANT_PACKAGE_NAME$: changeCase.constant(packageName),
    $PascalBrickName$: changeCase.pascal(brickName),
    "$kebab-brick-name$": `${packageName}.${brickName}`,
    "$generator.version$": `v${packageJson.version}`,
    "$brick.container.version$": brickContainerVersion,
    "$kebab-sdk-name$": sdkName
  };

  const filter = (src: string): boolean =>
    ignores.every(item => !src.includes(item));

  const templateGroups: any = [
    {
      templateDir,
      targetDir: targetRoot,
      files: klawSync(templateDir, {
        depthLimit: 4,
        nodir: true,
        filter: item => filter(item.path)
      })
    }
  ];

  if (targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS) {
    // Also create a new brick for the new bricks-package
    const brickTemplateDir = path.join(templateRoot, "brick");
    templateGroups.push({
      templateDir: brickTemplateDir,
      targetDir: path.join(targetRoot, "src", brickName),
      files: klawSync(brickTemplateDir, {
        depthLimit: 2,
        nodir: true,
        filter: item => filter(item.path)
      })
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
        filter: item => filter(item.path)
      })
    });

    let sdkVersion;
    try {
      const sdkPackage = await rp({
        url: `https://registry.npm.easyops.local/@sdk/${sdkName}`,
        json: true,
        strictSSL: false
      });
      sdkVersion = `^${sdkPackage["dist-tags"].latest}`;
    } catch {
      sdkVersion = "FETCH LATEST VERSION ERROR";
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
          const filenameFinds = Object.keys(translations).filter(key =>
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
            content
          ];
        })
      ),
    []
  );

  // create a new brick markdown for the new brick or the new bricks-package
  if (
    targetType === TargetType.A_NEW_BRICK ||
    targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS
  ) {
    const brickDocTemplatePath = path.join(
      templateRoot,
      "brick-doc",
      "brick-doc-template.md"
    );
    const content = fs.readFileSync(brickDocTemplatePath, "utf8");
    const targetMd = brickName + ".md";
    files.push([path.join(docRoot, packageName, targetMd), content]);
  }

  if (
    targetType !== TargetType.A_NEW_BRICK &&
    targetType !== TargetType.TRANSFORM_A_MICRO_APP
  ) {
    files.push([
      path.join(targetRoot, "package.json"),
      replaceDepsVersion(
        replaceFileContent(
          path.join(templateRoot, `${templateName}.json`),
          translations
        )
      )
    ]);
  }

  return files;
}
