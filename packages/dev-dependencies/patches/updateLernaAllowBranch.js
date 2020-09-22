const path = require("path");
const { writeJsonFile, readJson } = require("../utils");

function updateLernaAllowBranch() {
  const lernaJsonPath = path.resolve("lerna.json");
  const lernaJson = readJson(lernaJsonPath);

  const publish = lernaJson.command.publish;
  if (
    !Array.isArray(publish.allowBranch) ||
    !publish.allowBranch.includes("legacy/**")
  ) {
    publish.allowBranch = ["master", "legacy/**"];
    writeJsonFile(lernaJsonPath, lernaJson);
  }
}

exports.updateLernaAllowBranch = updateLernaAllowBranch;
