const tree = {
  "/tmp/bricks": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "bricks-a",
      isDirectory: () => true,
    },
  ],
  "/tmp/templates": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "templates-b",
      isDirectory: () => true,
    },
  ],
};

const jsonMap = {
  "/tmp/lerna.json": {
    useWorkspaces: true,
  },
  "/tmp/package.json": {
    name: "my-bricks",
    scripts: {
      build: "tsc",
      test: "jest",
      "test:ci": "jest --ci",
    },
  },
};

const mockExistsSync = jest.fn((dir) => !!tree[dir]);
const mockReaddirSync = jest.fn((dir) => tree[dir] || []);
const mockReadJsonSync = jest.fn((filePath) => {
  if (jsonMap[filePath]) {
    return jsonMap[filePath];
  }
  throw new Error(`File not found: ${filePath}`);
});
const mockWriteJsonSync = jest.fn();
const mockOutputFileSync = jest.fn();
const mockRemoveSync = jest.fn();

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readJsonSync: mockReadJsonSync,
  writeJsonSync: mockWriteJsonSync,
  outputFileSync: mockOutputFileSync,
  removeSync: mockRemoveSync,
}));

jest.mock("path", () => ({
  resolve: (dir) => `/tmp/${dir}`,
  join: (...paths) => paths.join("/"),
}));

const enableLernaWithNx = require("./enableLernaWithNx");

describe("enableLernaWithNx", () => {
  it("should work", () => {
    enableLernaWithNx();
    expect(mockWriteJsonSync).toHaveBeenCalledTimes(3);
    expect(mockOutputFileSync).toHaveBeenCalledTimes(2);

    expect(mockWriteJsonSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/nx.json",
      expect.objectContaining({
        tasksRunnerOptions: expect.anything(),
      })
    );
    expect(mockWriteJsonSync).toHaveBeenNthCalledWith(2, "/tmp/lerna.json", {
      useWorkspaces: true,
      useNx: true,
    });
    expect(mockWriteJsonSync).toHaveBeenNthCalledWith(3, "/tmp/package.json", {
      name: "my-bricks",
      scripts: {
        build: "tsc",
        test: "next-jest",
        "test:ci": "lerna run test:ci --",
      },
    });

    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/bricks/bricks-a/jest.config.js",
      `const { jestConfigFactory } = require("@next-core/jest-config-factory");

module.exports = jestConfigFactory({
  standalone: true,
  cwd: __dirname,
});
`
    );
  });
});
