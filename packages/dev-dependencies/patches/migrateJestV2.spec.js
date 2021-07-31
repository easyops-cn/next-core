const migrateJestV2 = require("./migrateJestV2");
const fs = require("fs");

jest.mock("fs");

const mockReadFileSync = fs.readFileSync;
const mockWriteFileSync = fs.writeFileSync;

describe("migrateJestV2", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work if with coverageThreshold", () => {
    mockReadFileSync.mockReturnValueOnce(
      `module.exports = {
  timers: "fake",
  coverageThreshold: {
    global: {
      statements: 88,
      branches: 77,
      functions: 87,
      lines: 88,
    },
  },
};
`
    );
    migrateJestV2();
    expect(mockWriteFileSync).toBeCalledWith(
      expect.stringContaining("jest.config.js"),
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory(),
  coverageThreshold: {
    global: {
      statements: 88,
      branches: 77,
      functions: 87,
      lines: 88,
    },
  },
};
`
    );
  });

  it("should work if without coverageThreshold", () => {
    mockReadFileSync.mockReturnValueOnce(
      `module.exports = {
  timers: "fake",
};
`
    );
    migrateJestV2();
    expect(mockWriteFileSync).toBeCalledWith(
      expect.stringContaining("jest.config.js"),
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory(),
};
`
    );
  });
});
