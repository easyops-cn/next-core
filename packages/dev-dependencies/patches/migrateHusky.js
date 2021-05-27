const path = require("path");
const fs = require("fs");
const execa = require("execa");
const { readJson, writeJsonFile } = require("../utils");

async function migrateHusky() {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = readJson(rootPackageJsonPath);
  const huskyrcPath = path.resolve(".huskyrc");
  if (fs.existsSync(huskyrcPath)) {
    const huskyrc = readJson(huskyrcPath);
    if (huskyrc.hooks["pre-commit"] === "lint-staged") {
      huskyrc.hooks["pre-commit"] = "npm run lint-staged";
      writeJsonFile(huskyrcPath, huskyrc);
    }
  }

  if (!rootPackageJson.scripts["lint-staged"]) {
    rootPackageJson.scripts["lint-staged"] = "lint-staged";
    writeJsonFile(rootPackageJsonPath, rootPackageJson);
  }

  await execa("npx", ["husky-init"], {
    stdio: "inherit",
  });

  await execa(
    "npx",
    ["--", "github:typicode/husky-4-to-6", "--remove-v4-config"],
    {
      stdio: "inherit",
    }
  );
}

module.exports = migrateHusky;
