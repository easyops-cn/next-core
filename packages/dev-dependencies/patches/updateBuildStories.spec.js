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
    {
      name: "bricks-b",
      isDirectory: () => true,
    },
    {
      name: "bricks-c",
      isDirectory: () => true,
    },
  ],
};

const contents = {
  "/tmp/bricks/bricks-a/package.json": `{
    "name": "bricks-a"
  }`,
  "/tmp/bricks/bricks-b/package.json": `{
    "name": "bricks-b",
    "scripts": {
      "build": "tsc"
    }
  }`,
  "/tmp/bricks/bricks-c/package.json": `{
    "name": "bricks-c",
    "scripts": {
      "build": "tsc",
      "build:stories": "tsc stories"
    }
  }`,
};

const mockExistsSync = jest.fn((dir) => !!tree[dir]);
const mockReaddirSync = jest.fn((dir) => tree[dir] || []);
const mockReadFileSync = jest.fn((filePath) => {
  if (contents[filePath]) {
    return contents[filePath];
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

const updateBuildStories = require("./updateBuildStories");

describe("updateBuildStories", () => {
  it("should work", () => {
    updateBuildStories();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(1);
    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/bricks/bricks-c/package.json",
      `{
  "name": "bricks-c",
  "scripts": {
    "build": "tsc",
    "build:stories": "if [ -d stories ];then  tsc stories/index.ts --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --outDir dist/stories; else echo \\" no stories \\"; fi"
  }
}`
    );
  });
});
