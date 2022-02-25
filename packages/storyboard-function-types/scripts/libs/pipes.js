const path = require("path");
const fs = require("fs-extra");

module.exports = function generateDeclarationsOfPipes() {
  const libName = "pipes";
  const pkgName = "@easyops-cn/brick-next-pipes";
  const pkgTypeDir = "dist/esm";

  const packageJsonPath = require.resolve(`${pkgName}/package.json`);
  const pkgDir = path.dirname(packageJsonPath);
  const absolutePkgTypeDir = path.join(pkgDir, pkgTypeDir);

  const typesDir = path.join(
    "node_modules/@types",
    pkgName.replace("@", "").replace("/", "__")
  );

  function readDeclarationsInDir(dir) {
    return fs
      .readdirSync(dir, {
        withFileTypes: true,
      })
      .flatMap((dirent) => {
        if (dirent.isDirectory()) {
          return readDeclarationsInDir(path.join(dir, dirent.name));
        } else if (dirent.isFile() && dirent.name.endsWith(".d.ts")) {
          const absolutePath = path.join(dir, dirent.name);
          return {
            filePath: path.join(
              typesDir,
              path.relative(absolutePkgTypeDir, absolutePath)
            ),
            content: fs.readFileSync(absolutePath, "utf-8").replace(
              // Ignore source-maps.
              /^\/\/# sourceMappingURL.*$/gm,
              ""
            ),
          };
        }
        return [];
      });
  }

  const libs = readDeclarationsInDir(absolutePkgTypeDir);

  libs.push({
    filePath: "builtin/PIPES.d.ts",
    content:
      'declare const PIPES: typeof import("@easyops-cn/brick-next-pipes").pipes;',
    // This is weird that we have to create model for this file too,
    // otherwise types will not work when re-adding it after disposing it.
    model: true,
  });

  return [libName, libs];
};
