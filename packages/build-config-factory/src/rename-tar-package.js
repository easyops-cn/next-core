const fs = require("fs");
const path = require("path");

const packageSuffixMap = {
  bricks: "NB",
  templates: "NT",
  "micro-apps": "NA"
};

module.exports = function() {
  const packageJson = require(path.resolve("package.json"));
  const [, scope, name] = packageJson.name.match(/^@([\w-]+)\/([\w-]+)$/);

  fs.renameSync(
    path.resolve(`${scope}-${name}-${packageJson.version}.tgz`),
    path.resolve(`${name}-${packageSuffixMap[scope]}.tgz`)
  );
};
