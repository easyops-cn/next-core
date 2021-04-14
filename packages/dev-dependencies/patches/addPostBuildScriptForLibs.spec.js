import fs from "fs";

const tree = {
  "/tmp/libs": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "libs-a",
      isDirectory: () => true,
    },
    {
      name: "libs-b",
      isDirectory: () => true,
    },
    {
      name: "libs-c",
      isDirectory: () => true,
    },
  ],
};

const contents = {
  "/tmp/libs/libs-a/package.json": `{
    "name": "libs-a"
  }`,
  "/tmp/libs/libs-b/package.json": `{
    "name": "libs-b",
    "scripts": {
      "build": "tsc",
      "test": "jest"
    }
  }`,
  "/tmp/libs/libs-c/package.json": `{
    "name": "libs-c",
    "scripts": {
      "build": "tsc",
      "build:types": "tsc --declaration",
      "test": "jest"
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

const addPostBuildScriptForLibs = require("./addPostBuildScriptForLibs");

describe("addPostBuildScriptForLibs", () => {
  it("should work", () => {
    addPostBuildScriptForLibs();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(4);

    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/libs/libs-b/package.json",
      `{
  "name": "libs-b",
  "scripts": {
    "build": "tsc",
    "postbuild": "node scripts/post-build.js",
    "test": "jest"
  }
}`
    );
    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      2,
      "/tmp/libs/libs-b/scripts/post-build.js",
      `const { postBuild } = require("@next-core/build-config-factory");

postBuild("libs");
`
    );

    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      3,
      "/tmp/libs/libs-c/package.json",
      `{
  "name": "libs-c",
  "scripts": {
    "build": "tsc",
    "build:types": "tsc --declaration",
    "postbuild": "node scripts/post-build.js",
    "test": "jest"
  }
}`
    );
    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      4,
      "/tmp/libs/libs-c/scripts/post-build.js",
      `const { postBuild } = require("@next-core/build-config-factory");

postBuild("libs");
`
    );
  });
});
