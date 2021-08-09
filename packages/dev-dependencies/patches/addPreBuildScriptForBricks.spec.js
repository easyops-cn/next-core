import fs from "fs";

const tree = {
  "/tmp/bricks": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "my-bricks",
      isDirectory: () => true,
    },
  ],
};

const contents = {
  "/tmp/bricks/my-bricks/package.json": `{
  "name": "@next-bricks/my-bricks",
  "scripts": {
    "start": "cross-env NODE_ENV='development' webpack --config webpack.config.js --watch",
    "build": "cross-env NODE_ENV='production' webpack --config webpack.config.js",
    "postbuild": "node scripts/post-build.js",
    "test": "cross-env NODE_ENV='test' jest"
  }
}`,
};

const mockExistsSync = jest.fn((dir) => !!tree[dir]);
const mockReaddirSync = jest.fn((dir) => tree[dir] || []);
const mockReadFileSync = jest.fn((filePath) => {
  if (contents[filePath]) {
    return contents[filePath];
  }
  // The path of template file is a real path.
  if (filePath.endsWith("/scripts/post-build.js")) {
    return fs.readFileSync(filePath, "utf8");
  }
  throw new Error(`File not found: ${filePath}`);
});
const mockOutputFileSync = jest.fn();

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
  outputFileSync: mockOutputFileSync,
}));

jest.mock("path", () => ({
  resolve: (dir) => `/tmp/${dir}`,
  join: (...paths) => paths.join("/"),
}));

jest.mock("prettier", () => ({
  format: (string) => JSON.stringify(JSON.parse(string), null, 2),
}));

const addPreBuildScriptForBricks = require("./addPreBuildScriptForBricks");

describe("addPreBuildScriptForBricks", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", () => {
    addPreBuildScriptForBricks();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(2);

    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/bricks/my-bricks/package.json",
      `{
  "name": "@next-bricks/my-bricks",
  "scripts": {
    "prestart": "node scripts/pre-build.js",
    "start": "cross-env NODE_ENV='development' webpack --config webpack.config.js --watch",
    "prebuild": "node scripts/pre-build.js",
    "build": "cross-env NODE_ENV='production' webpack --config webpack.config.js",
    "postbuild": "node scripts/post-build.js",
    "test": "cross-env NODE_ENV='test' jest"
  }
}`
    );

    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      2,
      "/tmp/bricks/my-bricks/scripts/pre-build.js",
      `const { preBuild } = require("@next-core/build-config-factory");

preBuild("bricks");
`
    );
  });

  it("should ignore if no brick packages", () => {
    mockExistsSync.mockReturnValueOnce(false);
    addPreBuildScriptForBricks();
    expect(mockOutputFileSync).not.toHaveBeenCalled();
  });
});
