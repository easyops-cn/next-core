// File System, hard to test for now.
/* istanbul ignore file */
import path from "path";
import os from "os";
import fs from "fs-extra";
import chalk from "chalk";
import prettier from "prettier";
import meow from "meow";
import { ask } from "./ask";
import { loadTemplate } from "./loaders/loadTemplate";
import { TargetType, AskFlags } from "./interface";
import { targetMap } from "./constant";
import * as changeCase from "change-case";

// 可以从命令行参数中指定生成类型。
const { flags } = meow({
  flags: {
    type: {
      type: "string",
      alias: "t"
    }
  }
});

export async function create(): Promise<void> {
  const appRoot = path.join(process.cwd());
  const { targetType, packageName, brickName, templateName } = await ask(
    appRoot,
    flags as AskFlags
  );

  const pkgRoot = path.join(appRoot, targetMap[targetType], packageName);
  const docRoot = path.join(
    appRoot,
    targetMap[TargetType.A_NEW_BRICK],
    "developers",
    "src",
    "stories",
    "docs"
  );

  let targetRoot: string;
  if (targetType === TargetType.A_NEW_BRICK) {
    targetRoot = path.join(pkgRoot, "src", brickName);
  } else if (targetType === TargetType.A_NEW_CUSTOM_PROVIDER_BRICK) {
    targetRoot = path.join(pkgRoot, "src", "data-providers");
  } else if (targetType === TargetType.A_NEW_TEMPLATE) {
    targetRoot = path.join(pkgRoot, "src");
  } else {
    targetRoot = path.join(pkgRoot);
  }

  const files = await loadTemplate({
    targetType,
    packageName,
    brickName,
    templateName,
    targetRoot,
    docRoot
  });

  if (targetType === TargetType.A_NEW_PACKAGE_OF_PROVIDERS) {
    // Providers 库可以覆盖生成。
    // 如果 `providers.json` 不存在时才新建，已存在时不覆盖。
    const providersJsonPath = path.join(targetRoot, "providers.json");
    if (!fs.existsSync(providersJsonPath)) {
      files.push([
        providersJsonPath,
        JSON.stringify(
          {
            sdk: `@sdk/${packageName.replace(/^providers-of-/, "")}-sdk`,
            providers: []
          },
          null,
          2
        )
      ]);
    }
  } else if (targetType === TargetType.TRANSFORM_A_MICRO_APP) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
    );
    const brickTypesVersion =
      packageJson.devDependencies["@easyops/brick-types"];
    const microAppPackageJsonPath = path.join(targetRoot, "package.json");
    const microAppPackageJson = require(microAppPackageJsonPath);
    Object.assign(microAppPackageJson.scripts, {
      start: "tsc -w --preserveWatchOutput & node scripts/build.js -w",
      prebuild: "rimraf dist && tsc",
      build: "node scripts/build.js"
    });
    Object.assign(microAppPackageJson, {
      devDependencies: {
        "@easyops/brick-types": brickTypesVersion
      }
    });

    files.push([
      microAppPackageJsonPath,
      JSON.stringify(microAppPackageJson, null, 2)
    ]);

    const storyboardJsonPath = path.join(targetRoot, "storyboard.json");
    const storyboardJson = require(storyboardJsonPath);
    delete storyboardJson.$schema;
    const srcIndexTs = path.join(pkgRoot, "src", "index.ts");
    files.push([
      srcIndexTs,
      prettier.format(
        `import { Storyboard } from "@easyops/brick-types";

const storyboard: Storyboard = ${JSON.stringify(storyboardJson)};

export default storyboard;`,
        { parser: "typescript" }
      )
    ]);
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

  if (
    [
      TargetType.A_NEW_BRICK,
      TargetType.A_NEW_CUSTOM_PROVIDER_BRICK,
      TargetType.A_NEW_PACKAGE_OF_BRICKS
    ].includes(targetType)
  ) {
    // 如果是新建构件/自定义provider构件/构件库，需要更新/新建 `index.ts`。
    const srcIndexTs = path.join(pkgRoot, "src", "index.ts");
    if (targetType === TargetType.A_NEW_CUSTOM_PROVIDER_BRICK) {
      fs.appendFileSync(
        srcIndexTs,
        `import "./data-providers/${changeCase.pascalCase(brickName)}";${
          os.EOL
        }`
      );
    } else {
      fs.appendFileSync(srcIndexTs, `import "./${brickName}";${os.EOL}`);
    }

    if (
      targetType === TargetType.A_NEW_BRICK ||
      targetType === TargetType.A_NEW_CUSTOM_PROVIDER_BRICK
    ) {
      console.log(
        `${chalk.bold("File updated")}: ./${path.relative(
          process.cwd(),
          srcIndexTs
        )}`
      );
    }
  } else if (
    [TargetType.A_NEW_TEMPLATE, TargetType.A_NEW_PACKAGE_OF_TEMPLATES].includes(
      targetType
    )
  ) {
    // 如果是新建模板/模板库，需要更新/新建 `index.ts`。
    const srcIndexTs = path.join(pkgRoot, "src", "index.ts");
    fs.appendFileSync(srcIndexTs, `import "./${templateName}";${os.EOL}`);

    if (targetType === TargetType.A_NEW_TEMPLATE) {
      console.log(
        `${chalk.bold("File updated")}: ./${path.relative(
          process.cwd(),
          srcIndexTs
        )}`
      );
    }
  } else if (targetType === TargetType.TRANSFORM_A_MICRO_APP) {
    const storyboardJsonPath = path.join(targetRoot, "storyboard.json");
    fs.unlinkSync(storyboardJsonPath);
    console.log(
      `${chalk.bold.red("File removed")}: ./${path.relative(
        process.cwd(),
        storyboardJsonPath
      )}`
    );
  } else if (targetType === TargetType.I18N_PATCH_A_PACKAGE_OF_TEMPLATES) {
    const srcIndexTs = path.join(pkgRoot, "src", "index.ts");
    fs.writeFileSync(
      srcIndexTs,
      `import "./i18n";${os.EOL}${fs.readFileSync(srcIndexTs)}`
    );
    console.log(
      `${chalk.bold("File updated")}: ./${path.relative(
        process.cwd(),
        srcIndexTs
      )}`
    );
  }

  console.log();
  console.log(chalk.green("No worries!"));
}
