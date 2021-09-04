const fs = require("fs");
const path = require("path");

module.exports = function ensureSingleRootBundle() {
  const rootBundles = fs
    .readdirSync(path.resolve("dist"))
    .filter((name) => name.endsWith(".js"));
  if (rootBundles.length > 1) {
    throw new Error(
      `Expect only a single root bundle, but received ${
        rootBundles.length
      }: ${rootBundles.join(", ")}`
    );
  }
  console.log("A single root bundle is matched.");
};
