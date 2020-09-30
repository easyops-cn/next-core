// istanbul ignore file
const path = require("path");
const fs = require("fs-extra");
const prettier = require("prettier");

exports.writeJsonFile = function writeJsonFile(filePath, content) {
  fs.outputFileSync(
    filePath,
    prettier.format(JSON.stringify(content), { parser: "json" })
  );
};

exports.readSelfJson = function readSelfJson() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
  );
};

exports.readJson = function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};
