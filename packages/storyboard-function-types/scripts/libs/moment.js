const path = require("path");
const fs = require("fs-extra");

module.exports = function generateDeclarationsOfMoment() {
  const libName = "moment";
  const pkgName = "moment";

  const libs = [];
  const typesDir = path.join("node_modules/@types", pkgName);
  const packageJsonPath = require.resolve(`${pkgName}/package.json`);
  const pkgDir = path.dirname(packageJsonPath);
  const indexDTs = fs.readFileSync(path.join(pkgDir, "moment.d.ts"), "utf-8");

  libs.push({
    filePath: path.join(typesDir, "index.d.ts"),
    content: indexDTs,
  });

  libs.push({
    filePath: "builtin/moment.d.ts",
    content: 'declare const moment: typeof import("moment");',
  });

  return [libName, libs];
};
