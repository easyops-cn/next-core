const path = require("path");
const fs = require("fs-extra");
const { writeJsonFile, readJson } = require("../utils");

// Use `build-next-libs` to build `@next-libs/*` and `@libs/*`
// instead of rollup. It uses `@babel/cli` under the hood,
// and it enables better tree-shaking.
function updateBuildNextLibs() {
  const packageDir = path.resolve("libs");

  if (!fs.existsSync(packageDir)) {
    return;
  }

  fs.readdirSync(packageDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const packageJsonPath = path.join(
        packageDir,
        dirent.name,
        "package.json"
      );
      const packageJson = readJson(packageJsonPath);
      if (
        packageJson.scripts["build:main"] ||
        [
          // Handle special cases.
          "@libs/flow-chart",
          "@libs/stereo",
          "@libs/stereo-three",
        ].includes(packageJson.name)
      ) {
        return;
      }
      packageJson.main = "dist/cjs/index.js";
      packageJson.module = "dist/esm/index.js";
      packageJson.scripts = Object.fromEntries(
        Object.entries(packageJson.scripts).map(([key, value]) => {
          switch (key) {
            case "start":
              return [
                key,
                'concurrently -k -n types,main "npm run start:types" "npm run start:main"',
              ];
            case "start:rollup":
              return [
                "start:main",
                "cross-env NODE_ENV=development build-next-libs --watch",
              ];
            case "build":
              return [key, "npm run build:types && npm run build:main"];
            case "build:rollup":
              return [
                "build:main",
                "cross-env NODE_ENV=production build-next-libs",
              ];
            default:
              return [key, value];
          }
        })
      );
      writeJsonFile(packageJsonPath, packageJson);
      fs.removeSync(path.join(packageDir, dirent.name, "rollup.config.js"));
      updateSvgUsage(path.join(packageDir, dirent.name, "src"));
    });
}

// Turn `import AnySvg from "**/*.svg"`
// into `import { ReactComponent as AnySvg } from "**/*.svg"`.
function updateSvgUsage(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isDirectory()) {
      updateSvgUsage(path.join(dir, dirent.name));
    } else if (dirent.isFile() && /(?<!\.spec)\.[tj]sx?$/.test(dirent.name)) {
      const filePath = path.join(dir, dirent.name);
      const content = fs.readFileSync(filePath, "utf-8");
      if (content.includes('.svg"')) {
        fs.outputFileSync(
          filePath,
          content.replace(
            /import\s+(\w+)\s+from\s+("[^"]+\.svg")/g,
            "import { ReactComponent as $1 } from $2"
          )
        );
      }
    }
  });
}

module.exports = updateBuildNextLibs;
