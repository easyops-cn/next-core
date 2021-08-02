const path = require("path");
const fs = require("fs");

async function migrateJestV2() {
  const jestConfigJs = path.resolve("jest.config.js");
  const jestConfig = fs.readFileSync(jestConfigJs, "utf-8");
  const coverageThreshold = jestConfig.match(
    /^ {2}coverageThreshold:[\s\S]+?^ {2}\}/m
  );
  fs.writeFileSync(
    jestConfigJs,
    `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory(),${coverageThreshold ? `\n${coverageThreshold},` : ""}
};
`
  );
}

module.exports = migrateJestV2;
