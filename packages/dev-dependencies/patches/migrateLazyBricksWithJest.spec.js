const migrateLazyBricksWithJest = require("./migrateLazyBricksWithJest");
const fs = require("fs");

jest.mock("fs");

const mockReadFileSync = fs.readFileSync;
const mockWriteFileSync = fs.writeFileSync;

describe("migrateLazyBricksWithJest", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work if with lazy-bricks", () => {
    mockReadFileSync.mockReturnValueOnce(
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory(
    {
      moduleNameMapper: {
        "^\\\\./lazy-bricks$": "identity-obj-proxy",
      }
    }
  ),
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
};`
    );
    migrateLazyBricksWithJest();
    expect(mockWriteFileSync).toBeCalledWith(
      expect.stringContaining("jest.config.js"),
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory(),
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
};
`
    );
  });

  it("should work if with lazy-bricks and other moduleNameMapper params", () => {
    mockReadFileSync.mockReturnValueOnce(
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory(
    {
      moduleNameMapper: {
        "^\\\\./lazy-bricks$": "identity-obj-proxy",
        foo: "bar"
      }
    }
  ),
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
};`
    );
    migrateLazyBricksWithJest();
    expect(mockWriteFileSync).toBeCalledWith(
      expect.stringContaining("jest.config.js"),
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory({
    moduleNameMapper: {
      foo: "bar",
    },
  }),
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
};
`
    );
  });

  it("should work if with lazy-bricks and other callee params", () => {
    mockReadFileSync.mockReturnValueOnce(
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory(
    {
      moduleNameMapper: {
        "^\\\\./lazy-bricks$": "identity-obj-proxy",
      },
      transformModulePatterns: []
    }
  ),
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
};`
    );
    migrateLazyBricksWithJest();
    expect(mockWriteFileSync).toBeCalledWith(
      expect.stringContaining("jest.config.js"),
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = {
  ...jestConfigFactory({
    transformModulePatterns: [],
  }),
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
};
`
    );
  });
});
