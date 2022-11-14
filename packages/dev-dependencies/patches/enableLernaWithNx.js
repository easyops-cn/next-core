const path = require("path");
const fs = require("fs-extra");

function enableLernaWithNx() {
  const nxJsonPath = path.resolve("nx.json");
  if (fs.existsSync(nxJsonPath)) {
    return;
  }

  fs.writeJsonSync(
    nxJsonPath,
    {
      tasksRunnerOptions: {
        default: {
          runner: "nx/tasks-runners/default",
          options: {
            cacheableOperations: ["build", "test", "test:ci"],
            cacheDirectory: ".cache",
            useDaemonProcess: false,
          },
        },
      },
      namedInputs: {
        default: ["{projectRoot}/**/*"],
        prod: ["!{projectRoot}/**/*.spec.*"],
        global: [
          "{workspaceRoot}/package.json",
          "{workspaceRoot}/yarn.lock",
          "{workspaceRoot}/babel.config.js",
          "{workspaceRoot}/tsconfig.json",
        ],
      },
      targetDefaults: {
        build: {
          dependsOn: ["^build"],
          inputs: ["prod", "^prod", "global"],
          outputs: [
            "{projectRoot}/dist",
            "{projectRoot}/deploy",
            "{projectRoot}/.pkgbuild",
            "{projectRoot}/src/lazy-bricks",
          ],
        },
        test: {
          inputs: ["default", "^prod", "global"],
          outputs: ["{projectRoot}/.coverage"],
        },
        "test:ci": {
          inputs: ["default", "^prod", "global"],
          outputs: ["{projectRoot}/.coverage"],
        },
      },
    },
    { spaces: 2 }
  );

  const lernaJsonPath = path.resolve("lerna.json");
  const lernaJson = fs.readJsonSync(lernaJsonPath);
  lernaJson.useNx = true;
  fs.writeJsonSync(lernaJsonPath, lernaJson, { spaces: 2 });

  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = fs.readJsonSync(rootPackageJsonPath);
  rootPackageJson.scripts.test = "next-jest";
  rootPackageJson.scripts["test:ci"] = "lerna run test:ci --";
  fs.writeJsonSync(rootPackageJsonPath, rootPackageJson, { spaces: 2 });

  const types = ["bricks", "libs", "templates"];
  for (const type of types) {
    const pkgDir = path.resolve(type);
    if (!fs.existsSync(pkgDir)) {
      continue;
    }
    for (const item of fs.readdirSync(pkgDir, { withFileTypes: true })) {
      if (item.isDirectory()) {
        fs.outputFileSync(
          path.join(pkgDir, item.name, "jest.config.js"),
          `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = jestConfigFactory({
  standalone: true,
  cwd: __dirname,
});
`
        );
      }
    }
  }

  const gitignorePath = path.resolve(".gitignore");
  fs.appendFileSync(gitignorePath, "\n.cache");

  fs.removeSync(path.resolve("jest.config.js"));
}

module.exports = enableLernaWithNx;
