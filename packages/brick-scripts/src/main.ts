// File System, hard to test for now.
/* istanbul ignore file */
import path from "path";
import os from "os";
import fs from "fs-extra";
import chalk from "chalk";
import * as changeCase from "change-case";
import { getEasyopsConfig } from "@next-core/repo-config";
import { ask } from "./ask";
import { loadTemplate } from "./loaders/loadTemplate";
import { TargetType, AskFlags } from "./interface";
import { targetMap } from "./constant";
import { scriptYarnInstall } from "./scripts";

const { usePublicScope } = getEasyopsConfig();

const npmScopeOfSdk = usePublicScope ? "@next-sdk" : "@sdk";

export async function create(flags: AskFlags): Promise<void> {
  const appRoot = path.join(process.cwd());
  let targetType: TargetType;
  let packageName = "";
  let brickName = "";
  let processorName = "";
  if (flags.provider) {
    targetType = TargetType["A_NEW_PACKAGE_OF_PROVIDERS"];
    packageName = `providers-of-${flags.provider}`;
  } else {
    ({ targetType, packageName, brickName, processorName } = await ask(
      appRoot,
      flags
    ));
  }

  const pkgRoot = path.join(appRoot, targetMap[targetType], packageName);

  let targetRoot: string;
  switch (targetType) {
    case TargetType.A_NEW_BRICK:
      targetRoot = path.join(pkgRoot, "src", brickName);
      break;
    case TargetType.A_NEW_CUSTOM_TEMPLATE:
      targetRoot = path.join(pkgRoot, "src/custom-templates");
      break;
    case TargetType.A_NEW_CUSTOM_PROVIDER:
      targetRoot = path.join(pkgRoot, "src/data-providers");
      break;
    case TargetType.A_NEW_CUSTOM_PROCESSOR:
      targetRoot = path.join(pkgRoot, "src/custom-processors");
      break;
    default:
      targetRoot = path.join(pkgRoot);
  }

  let files = await loadTemplate({
    targetType,
    packageName,
    brickName,
    processorName,
    targetRoot,
  });

  switch (targetType) {
    case TargetType.A_NEW_PACKAGE_OF_PROVIDERS:
      {
        // 不覆盖生成，后续如果需要可以询问时加多一步是否覆盖
        const packageJson = path.join(targetRoot, "package.json");
        if (fs.existsSync(packageJson)) {
          console.log(chalk.yellow(`${packageName} exist provider`));
          files = [];
        }
        // 如果 `providers.json` 不存在时才新建，已存在时不覆盖。
        const providersJsonPath = path.join(targetRoot, "providers.json");
        if (!fs.existsSync(providersJsonPath)) {
          files.push([
            providersJsonPath,
            JSON.stringify(
              {
                sdk: `${npmScopeOfSdk}/${packageName.replace(
                  /^providers-of-/,
                  ""
                )}-sdk`,
                providers: [],
              },
              null,
              2
            ),
          ]);
        }
      }
      break;
  }

  for (const [filePath, content] of files) {
    fs.outputFileSync(filePath, content);
    console.log(
      `${chalk.bold("File created")}: ./${path.relative(
        process.cwd(),
        filePath
      )}`
    );
  }

  switch (targetType) {
    case TargetType.A_NEW_BRICK:
    case TargetType.A_NEW_CUSTOM_TEMPLATE:
    case TargetType.A_NEW_CUSTOM_PROVIDER:
    case TargetType.A_NEW_CUSTOM_PROCESSOR:
    case TargetType.A_NEW_PACKAGE_OF_BRICKS:
      if (brickName || processorName) {
        // 如果是新建构件/自定义provider构件/构件库，需要更新/新建 `index.ts`。
        const srcIndexTs = path.join(pkgRoot, "src/index.ts");
        switch (targetType) {
          case TargetType.A_NEW_CUSTOM_PROVIDER:
            fs.appendFileSync(
              srcIndexTs,
              `import "./data-providers/${changeCase.pascalCase(brickName)}";${
                os.EOL
              }`
            );
            break;
          case TargetType.A_NEW_CUSTOM_TEMPLATE:
            fs.appendFileSync(
              srcIndexTs,
              `import "./custom-templates/${brickName}";${os.EOL}`
            );
            break;
          case TargetType.A_NEW_CUSTOM_PROCESSOR:
            fs.appendFileSync(
              srcIndexTs,
              `import "./custom-processors/${processorName}";${os.EOL}`
            );
            break;
          default:
            fs.appendFileSync(srcIndexTs, `import "./${brickName}";${os.EOL}`);
        }

        if (
          targetType === TargetType.A_NEW_BRICK ||
          targetType === TargetType.A_NEW_CUSTOM_TEMPLATE ||
          targetType === TargetType.A_NEW_CUSTOM_PROVIDER ||
          targetType === TargetType.A_NEW_CUSTOM_PROCESSOR
        ) {
          console.log(
            `${chalk.bold("File updated")}: ./${path.relative(
              process.cwd(),
              srcIndexTs
            )}`
          );
        }

        if (
          targetType === TargetType.A_NEW_CUSTOM_TEMPLATE ||
          targetType === TargetType.A_NEW_CUSTOM_PROCESSOR
        ) {
          // 如果新增了自定义模板或自定义加工函数，`src/index.spec.ts` 需要更新。
          const indexSpecTs = path.join(pkgRoot, "src/index.spec.ts");
          if (fs.existsSync(indexSpecTs)) {
            const currentContent = fs.readFileSync(indexSpecTs, "utf8");
            if (!currentContent.includes("registerCustomProcessor")) {
              const templateContent = fs.readFileSync(
                path.join(
                  __dirname,
                  "../template/bricks-pkg/src/index.spec.ts"
                ),
                "utf8"
              );
              fs.writeFileSync(indexSpecTs, templateContent);
              console.log(
                `${chalk.bold("File updated")}: ./${path.relative(
                  process.cwd(),
                  indexSpecTs
                )}`
              );
            }
          }
        }
      }
      break;
  }

  if (
    [
      TargetType.A_NEW_PACKAGE_OF_BRICKS,
      TargetType.A_NEW_PACKAGE_OF_LIBS,
      TargetType.A_NEW_PACKAGE_OF_PROVIDERS,
    ].includes(targetType)
  ) {
    // Run `yarn` after created a new package.
    await scriptYarnInstall(appRoot);
  }

  console.log();
  console.log(chalk.green("No worries!"));
}
