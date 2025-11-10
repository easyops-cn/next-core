import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "jsonc-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const validPkgName = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const validBrickName = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

const rootDir = process.cwd();
const bricksDir = path.join(rootDir, "bricks");
const sharedDir = path.join(rootDir, "shared");

const packageJson = JSON.parse(
  await readFile(path.join(rootDir, "package.json"))
);
const yoPackageJson = JSON.parse(
  await readFile(path.join(__dirname, "../package.json"))
);

export default function (
  /** @type {import('plop').NodePlopAPI} */
  plop
) {
  const isOnGitHub = packageJson.homepage.includes("github.com");
  const dependencies = {};
  const devDependencies = {};
  const libDevDependencies = {};
  for (const [dep, version] of Object.entries(yoPackageJson.devDependencies)) {
    switch (dep) {
      case "@next-core/build-next-libs":
        libDevDependencies[dep] = version;
        break;
      case "@next-core/test-next":
        libDevDependencies[dep] = version;
      // NOTE: Intentionally fallthrough
      // eslint-disable-next-line no-fallthrough
      case "@next-core/build-next-bricks":
        devDependencies[dep] = version;
        break;
      default:
        dependencies[dep] = version;
    }
  }

  plop.setPartial("scope", isOnGitHub ? "@next-bricks" : "@bricks");
  plop.setPartial("libScope", isOnGitHub ? "@next-shared" : "@shared");
  plop.setPartial("homepage", packageJson.homepage.replace(/\/$/, ""));
  plop.setPartial(
    "repository",
    getObjectPartialInPackageJson({
      ...packageJson.repository,
      directory: "{{getDirectory type pkgName libName}}",
    })
  );
  plop.setPartial(
    "license",
    packageJson.license ?? (isOnGitHub ? "GPL-3.0" : "UNLICENSED")
  );
  plop.setPartial("dependencies", getObjectPartialInPackageJson(dependencies));
  plop.setPartial(
    "devDependencies",
    getObjectPartialInPackageJson(devDependencies)
  );
  plop.setPartial(
    "libDevDependencies",
    getObjectPartialInPackageJson(libDevDependencies)
  );
  plop.setHelper(
    "getTagName",
    (brickType, pkgName, brickName, lastNameOnly, stripEo) =>
      brickType === "common"
        ? stripEo
          ? brickName
          : `eo-${brickName}`
        : lastNameOnly
          ? brickName
          : `${pkgName}.${brickName}`
  );
  plop.setHelper("getDirectory", (type, pkgName, libName) =>
    type === "bricks"
      ? `bricks/${pkgName}`
      : type === "shared"
        ? `shared/${libName}`
        : null
  );
  plop.setPartial(
    "tagName",
    "{{getTagName brickType pkgName brickName false false}}"
  );
  plop.setPartial(
    "lastTagName",
    "{{getTagName brickType pkgName brickName true false}}"
  );
  plop.setPartial(
    "className",
    "{{pascalCase (getTagName brickType pkgName brickName true true)}}"
  );

  // create your generators here
  plop.setGenerator("basics", {
    description: "application controller logic",
    prompts: [
      {
        type: "list",
        name: "type",
        message: "What do you want to do?",
        choices: [
          {
            name: "Add a new brick",
            value: "brick",
          },
          {
            name: "Add a new provider",
            value: "provider",
          },
          {
            name: "Create a new brick package",
            value: "bricks",
          },
          {
            name: "Create a new shared library",
            value: "shared",
          },
          {
            name: "Setup VSCode testing settings",
            value: "vscode-testing",
          },
        ],
      },
      {
        type: "input",
        name: "pkgName",
        message: "Your package name:",
        when(data) {
          return data.type === "bricks";
        },
        validate(value) {
          if (!validPkgName.test(value)) {
            return "Please enter a lower-kebab-case package name.";
          }

          if (value.startsWith("providers-of-")) {
            return "`providers-of-*` is reserved, please enter another name.";
          }

          if (existsSync(path.join(bricksDir, value))) {
            return `Package "${value}" exists, please enter another name.`;
          }

          return true;
        },
      },
      {
        type: "list",
        name: "pkgName",
        message: "Select your package first:",
        when(data) {
          return data.type === "brick" || data.type === "provider";
        },
        choices: async () => {
          const dirs = await readdir(bricksDir, { withFileTypes: true });
          return dirs
            .filter(
              (dir) =>
                dir.isDirectory() &&
                existsSync(path.join(bricksDir, dir.name, "package.json"))
            )
            .map((dir) => dir.name)
            .sort();
        },
      },
      {
        type: "input",
        name: "libName",
        message: "Your library name:",
        when(data) {
          return data.type === "shared";
        },
        validate(value) {
          if (!validPkgName.test(value)) {
            return "Please enter a lower-kebab-case library name.";
          }

          if (existsSync(path.join(sharedDir, value))) {
            return `Library "${value}" exists, please enter another name.`;
          }

          return true;
        },
      },
      {
        type: "list",
        name: "brickType",
        message: "Select your brick type:",
        when(data) {
          return data.type === "brick";
        },
        choices: [
          {
            name: "Business-specific brick (starts with namespace)",
            value: "specific",
          },
          {
            name: "Common brick (starts with `eo-`, no namespace)",
            value: "common",
          },
        ],
      },
      {
        type: "input",
        name: "brickName",
        message: "Your brick name:",
        when(data) {
          return data.type === "brick";
        },
        async validate(value, data) {
          const realBrickName =
            data.brickType === "common" ? `eo-${value}` : value;
          if (!validBrickName.test(realBrickName)) {
            return "Please enter a lower-kebab-case brick name.";
          }

          if (existsSync(path.join(bricksDir, data.pkgName, "src", value))) {
            return `Brick "${realBrickName}" seems to be existed, please enter another name.`;
          }

          const commonBricksJsonFile = path.join(
            rootDir,
            "shared/common-bricks/common-bricks.json"
          );
          if (data.brickType === "common" && existsSync(commonBricksJsonFile)) {
            const commonBricksJson = JSON.parse(
              await readFile(commonBricksJsonFile, "utf-8")
            );
            for (const [pkg, commonBricks] of Object.entries(
              commonBricksJson
            )) {
              if (commonBricks.includes(realBrickName)) {
                return `Brick "${realBrickName}" existed in package "${pkg}", please enter another name.`;
              }
            }
          }

          return true;
        },
        transformer(input, data) {
          return data.brickType === "common"
            ? `eo-${input}`
            : `${data.pkgName}.${input}`;
        },
      },
      {
        type: "confirm",
        name: "useI18n",
        message: "Use i18n with this brick?",
        when(data) {
          return data.type === "brick";
        },
      },
      {
        type: "input",
        name: "providerName",
        message: "Your provider name:",
        when(data) {
          return data.type === "provider";
        },
        validate(value, data) {
          if (!validBrickName.test(value)) {
            return "Please enter a lower-kebab-case provider name.";
          }

          if (
            existsSync(
              path.join(
                bricksDir,
                data.pkgName,
                "src/data-providers",
                `${value}.ts`
              )
            )
          ) {
            return `Provider "${value}" seems to be existed, please enter another name.`;
          }

          return true;
        },
        transformer(input, data) {
          return `${data.pkgName}.${input}`;
        },
      },
    ],
    actions(data) {
      if (data.type === "brick") {
        return [
          {
            type: "addMany",
            destination: "bricks/{{pkgName}}/src/{{brickName}}",
            base: "templates/brick",
            templateFiles: data.useI18n
              ? "templates/brick"
              : "templates/brick/!(i18n.ts)",
          },
          {
            type: "append",
            path: "bricks/{{pkgName}}/src/bootstrap.ts",
            template: 'import "./{{brickName}}/index.js";\n',
            separator: "",
          },
          {
            type: "add",
            path: "bricks/{{pkgName}}/docs/{{>lastTagName}}.md",
            templateFile: "templates/brick.md.hbs",
          },
          async function updateJsxDts(answers) {
            const jsxDtsFile = path.join(
              bricksDir,
              answers.pkgName,
              "src/jsx.d.ts"
            );
            /** @type {string} */
            let jsxDtsContent;
            if (!existsSync(jsxDtsFile)) {
              // jsxDtsContent = `import type { DetailedHTMLProps, HTMLAttributes } from "react"`;
              const jsxDtsTemplateFile = path.join(
                __dirname,
                "templates/bricks/src/jsx.d.ts.hbs"
              );
              jsxDtsContent = await readFile(jsxDtsTemplateFile, "utf-8");
            } else {
              jsxDtsContent = await readFile(jsxDtsFile, "utf-8");
            }
            const tagName = plop.renderString(
              "{{getTagName brickType pkgName brickName false false}}",
              answers
            );
            const className = plop.renderString(
              "{{pascalCase (getTagName brickType pkgName brickName true true)}}",
              answers
            );
            const propName = `${className}Props`;
            const importStatement = `import type { ${className}, ${propName} } from "./${answers.brickName}";`;
            const definitionProp = `      "${tagName}": DetailedHTMLProps<HTMLAttributes<${className}>, ${className}> & ${propName};`;

            /** @type {[RegExp, string][]} */
            const replacementPatterns = [
              [
                /(\r?\n)(\r?\n)?(declare global )/,
                `$1${importStatement}$1$2$3`,
              ],
              [
                // eslint-disable-next-line no-regex-spaces
                /(\r?\n)(    \}\r?\n  \}\r?\n\}\r?\n)$/,
                `$1${definitionProp}$1$2`,
              ],
            ];

            for (const [pattern, replacement] of replacementPatterns) {
              const newJsxDts = jsxDtsContent.replace(pattern, replacement);
              if (newJsxDts === jsxDtsContent) {
                throw new Error(
                  `Failed to add definition in jsx.d.ts for ${tagName}.`
                );
              }
              jsxDtsContent = newJsxDts;
            }

            await writeFile(jsxDtsFile, jsxDtsContent);
            return `Updated jsx.d.ts to include ${tagName} definition.`;
          },
          async function modifyCommonBricksJson(answers) {
            if (answers.brickType === "common") {
              const realBrickName = `eo-${answers.brickName}`;
              const commonBricksJsonFile = path.join(
                rootDir,
                "shared/common-bricks/common-bricks.json"
              );
              /** @type {Record<string, string[]>} */
              let commonBricksJson;
              /** @type {string[]} */
              let commonBricks;
              if (existsSync(commonBricksJsonFile)) {
                commonBricksJson = JSON.parse(
                  await readFile(commonBricksJsonFile, "utf-8")
                );
                if (
                  Object.prototype.hasOwnProperty.call(
                    commonBricksJson,
                    answers.pkgName
                  )
                ) {
                  commonBricks = commonBricksJson[answers.pkgName];
                } else {
                  commonBricks = commonBricksJson[answers.pkgName] = [];
                }
              } else {
                commonBricksJson = {};
                commonBricks = commonBricksJson[answers.pkgName] = [];
              }
              commonBricks.push(realBrickName);
              await writeFile(
                commonBricksJsonFile,
                JSON.stringify(commonBricksJson, null, 2)
              );
              return plop.renderString(
                `added {{pkgName}}: ${realBrickName} in /shared/common-bricks/common-bricks.json`,
                answers
              );
            }
          },
        ];
      } else if (data.type === "provider") {
        return [
          {
            type: "add",
            path: "bricks/{{pkgName}}/src/data-providers/{{providerName}}.ts",
            templateFile: "templates/provider/provider.ts.hbs",
          },
          {
            type: "add",
            path: "bricks/{{pkgName}}/src/data-providers/{{providerName}}.spec.ts",
            templateFile: "templates/provider/provider.spec.ts.hbs",
          },
          {
            type: "append",
            path: "bricks/{{pkgName}}/src/bootstrap.ts",
            template: 'import "./data-providers/{{providerName}}.js";\n',
            separator: "",
          },
        ];
      } else if (data.type === "bricks") {
        return [
          {
            type: "addMany",
            destination: "bricks/{{pkgName}}",
            base: "templates/bricks",
            templateFiles: "templates/bricks",
          },
        ];
      } else if (data.type === "shared") {
        return [
          {
            type: "addMany",
            destination: "shared/{{libName}}",
            base: "templates/shared",
            templateFiles: "templates/shared",
          },
        ];
      } else if (data.type === "vscode-testing") {
        return [initVscodeTesting];
      }
      return [];
    },
  });
}

function getObjectPartialInPackageJson(object) {
  return JSON.stringify(object, null, 4).replace(/\}\s*$/, "  }");
}

async function initVscodeTesting() {
  const folders = await getWorkspaceFolders();
  if (folders.length === 0) {
    return "No workspace folders found, are you sure this is a monorepo?";
  }

  const vscodeDir = path.join(rootDir, ".vscode");
  if (!existsSync(vscodeDir)) {
    await mkdir(vscodeDir);
  }

  const settingsJson = path.join(vscodeDir, "settings.json");
  let settings = {};
  if (existsSync(settingsJson)) {
    // settings = JSON.parse(await readFile(settingsJson, "utf-8"));
    const errors = [];
    settings = parse(await readFile(settingsJson, "utf-8"), errors, {
      allowTrailingComma: true,
    });
    if (errors.length > 0) {
      return `Failed to parse existing .vscode/settings.json: ${errors
        .map((e) => `at offset ${e.offset} (${e.error})`)
        .join(", ")}`;
    }
  }
  Object.assign(settings, {
    "jest.runMode": "on-demand",
    "jest.jestCommandLine": "npx test-next",
    "jest.useJest30": true,
    "jest.nodeEnv": {
      NODE_ENV: "test",
    },
    "jest.virtualFolders": folders.map((folder) => ({
      name: folder,
      rootPath: folder,
    })),
  });
  await writeFile(settingsJson, JSON.stringify(settings, null, 2) + "\n");

  const launchJson = path.join(vscodeDir, "launch.json");
  let launchConfig = {};
  if (existsSync(launchJson)) {
    const errors = [];
    launchConfig = parse(await readFile(launchJson, "utf-8"), errors, {
      allowTrailingComma: true,
    });
    if (errors.length > 0) {
      return `Failed to parse existing .vscode/launch.json: ${errors
        .map((e) => `at offset ${e.offset} (${e.error})`)
        .join(", ")}`;
    }
  }
  const configs = folders.map((folder) => ({
    type: "node",
    name: `vscode-jest-tests.v2.${folder}`,
    request: "launch",
    args: [
      "--runInBand",
      "--watchAll=false",
      "--testNamePattern",
      "${jest.testNamePattern}",
      "--runTestsByPath",
      "${jest.testFile}",
    ],
    cwd: `${rootDir}/${folder}`,
    console: "integratedTerminal",
    internalConsoleOptions: "neverOpen",
    program: `${rootDir}/node_modules/.bin/test-next`,
    env: {
      NODE_ENV: "test",
    },
  }));
  launchConfig.configurations = [
    ...(launchConfig.configurations?.filter(
      (config) => !config.name?.startsWith("vscode-jest-tests.")
    ) ?? []),
    ...configs,
  ];
  await writeFile(launchJson, JSON.stringify(launchConfig, null, 2) + "\n");

  return 'Updated VSCode testing settings in ".vscode/settings.json" and ".vscode/launch.json".';
}

async function getWorkspaceFolders() {
  const { workspaces } = packageJson;
  /** @type {string[]} */
  const folders = (
    await Promise.all(
      workspaces.map(async (pattern) => {
        const result = [];
        if (pattern.endsWith("/*")) {
          const folder = pattern.slice(0, -2);
          const dir = path.join(rootDir, folder);
          const dirs = await readdir(dir, {
            withFileTypes: true,
          });
          for (const d of dirs) {
            const pkgJsonPath = path.join(dir, d.name, "package.json");
            if (d.isDirectory() && existsSync(pkgJsonPath)) {
              const pkg = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
              if (pkg.scripts?.test) {
                result.push(path.join(folder, d.name));
              }
            }
          }
        } else {
          const dir = path.join(rootDir, pattern);
          const pkgJsonPath = path.join(dir, "package.json");
          if (existsSync(pkgJsonPath)) {
            const pkg = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
            if (pkg.scripts?.test) {
              result.push(pattern);
            }
          }
        }
        return result;
      })
    )
  ).flat();
  return folders;
}
