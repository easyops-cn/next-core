const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = jestConfigFactory({
  standalone: true,
  testPathIgnorePatterns: ["/template/", "/cypress/"],
});
