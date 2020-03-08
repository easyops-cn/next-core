const path = require("path");
const fs = require("fs");
const prettier = require("prettier");

exports.writeJsonFile = function writeJsonFile(filePath, content) {
  fs.writeFileSync(
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
