const fs = require("fs");
const path = require("path");
const moment = require("moment");

module.exports = function generateVersionFile() {
  const packageJson = require(path.resolve("package.json"));
  const version = packageJson.version;

  const execTime = moment().format("YYYY-MM-DDTHH:mm:ss");

  fs.writeFileSync(path.resolve("version.ini"), execTime + "\n" + version);
};
