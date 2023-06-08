import path from "node:path";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const validPkgName = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const validBrickName = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

const rootDir = process.cwd();
const bricksDir = path.join(rootDir, "bricks");

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
  for (const [dep, version] of Object.entries(yoPackageJson.devDependencies)) {
    switch (dep) {
      case "@next-core/build-next-bricks":
      case "@next-core/test-next":
        devDependencies[dep] = version;
        break;
      default:
        dependencies[dep] = version;
    }
  }

  plop.setPartial("scope", isOnGitHub ? "@next-bricks" : "@bricks");
  plop.setPartial("homepage", packageJson.homepage.replace(/\/$/, ""));
  plop.setPartial(
    "repository",
    getObjectPartialInPackageJson(packageJson.repository)
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
        name: "brickName",
        message: "Your brick name:",
        when(data) {
          return data.type === "brick";
        },
        validate(value, data) {
          if (!validBrickName.test(value)) {
            return "Please enter a lower-kebab-case brick name.";
          }

          if (existsSync(path.join(bricksDir, data.pkgName, "src", value))) {
            return `Brick "${value}" seems to be existed, please enter another name.`;
          }

          return true;
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
      },
    ],
    actions(data) {
      if (data.type === "brick") {
        return [
          {
            type: "addMany",
            destination: "bricks/{{pkgName}}/src/{{brickName}}",
            base: "templates/brick",
            templateFiles: "templates/brick",
          },
          {
            type: "append",
            path: "bricks/{{pkgName}}/src/bootstrap.ts",
            template: 'import "./{{brickName}}/index.js";\n',
            separator: "",
          },
          {
            type: "add",
            path: "bricks/{{pkgName}}/docs/{{brickName}}.md",
            templateFile: "templates/brick.md.hbs",
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
      }
      return [];
    },
  });
}

function getObjectPartialInPackageJson(object) {
  return JSON.stringify(object, null, 4).replace(/\}\s*$/, "  }");
}
