const path = require("path");
const fs = require("fs");

async function migrateJest() {
  const jestConfigJs = path.resolve("jest.config.js");
  const jestConfig = fs.readFileSync(jestConfigJs, "utf-8");
  fs.writeFileSync(
    jestConfigJs,
    jestConfig.replace(
      "module.exports = {",
      'module.exports = {\n  testEnvironment: "jsdom",'
    )
  );

  const jestSetupTs = path.resolve("__jest__/setup.ts");
  const jestSetup = fs.readFileSync(jestSetupTs, "utf-8");
  fs.writeFileSync(
    jestSetupTs,
    `import { setImmediate as flushMicroTasks } from "timers";\n${jestSetup.replace(
      "setImmediate",
      "flushMicroTasks"
    )}`
  );
}

module.exports = migrateJest;
