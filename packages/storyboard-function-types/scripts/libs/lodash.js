const path = require("path");
const fs = require("fs-extra");

module.exports = function generateDeclarationsOfLodash() {
  const libName = "lodash";
  const pkgName = "@types/lodash";

  const libs = [];
  const typesDir = path.join("node_modules", pkgName);
  const packageJsonPath = require.resolve(`${pkgName}/package.json`);
  const pkgDir = path.dirname(packageJsonPath);
  const indexDTs = fs.readFileSync(path.join(pkgDir, "index.d.ts"), "utf-8");

  libs.push({
    filePath: path.join(typesDir, "index.d.ts"),
    content: indexDTs.replace(/\/\/\s*Backward compatibility[\s\S]+/, ""),
  });

  const referenceRegExp = /\/\/\/\s*<reference\s+path="([^"]+)"\s*\/>/g;
  let match;
  while ((match = referenceRegExp.exec(indexDTs))) {
    const ref = match[1];
    libs.push({
      filePath: path.join(typesDir, ref),
      content: fs.readFileSync(path.join(pkgDir, ref), "utf-8"),
    });
  }

  return [libName, libs];
};
