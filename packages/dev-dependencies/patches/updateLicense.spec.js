const tree = {
  "/tmp/bricks": [
    {
      name: "bricks-a",
      isDirectory: () => true,
    },
    {
      name: "bricks-b",
      isDirectory: () => true,
    },
  ],
  "/tmp/micro-apps": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "app-a",
      isDirectory: () => true,
    },
    {
      name: "app-b",
      isDirectory: () => true,
    },
  ],
};

const contents = {
  "/tmp/bricks/bricks-a/package.json": `{
    "name": "bricks-a",
    "license": "UNLICENSED"
  }`,
  "/tmp/bricks/bricks-b/package.json": `{
    "name": "bricks-b"
  }`,
  "/tmp/micro-apps/app-a/package.json": `{
    "name": "app-a",
    "license": "UNLICENSED"
  }`,
  "/tmp/micro-apps/app-b/package.json": `{
    "name": "app-b"
  }`,
};

const mockExistsSync = jest.fn((dir) => !!tree[dir]);
const mockReaddirSync = jest.fn((dir) => tree[dir] || []);
const mockReadJson = jest.fn((filePath) => {
  if (contents[filePath]) {
    return JSON.parse(contents[filePath]);
  }
  throw new Error(`File not found: ${filePath}`);
});
const mockWriteJsonFile = jest.fn();

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
}));

jest.mock("path", () => ({
  resolve: (dir) => `/tmp/${dir}`,
  join: (...paths) => paths.join("/"),
}));

jest.mock("../utils", () => ({
  readJson: mockReadJson,
  writeJsonFile: mockWriteJsonFile,
}));

const updateLicense = require("./updateLicense");

describe("updateLicense", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", () => {
    updateLicense({
      name: "tmp",
      license: "GPL-3.0",
    });
    expect(mockWriteJsonFile).toHaveBeenCalledTimes(4);
    expect(mockWriteJsonFile).toHaveBeenNthCalledWith(
      1,
      "/tmp/bricks/bricks-a/package.json",
      {
        name: "bricks-a",
        license: "GPL-3.0",
      }
    );
    expect(mockWriteJsonFile).toHaveBeenNthCalledWith(
      2,
      "/tmp/bricks/bricks-b/package.json",
      {
        name: "bricks-b",
        license: "GPL-3.0",
      }
    );
    expect(mockWriteJsonFile).toHaveBeenNthCalledWith(
      3,
      "/tmp/micro-apps/app-a/package.json",
      {
        name: "app-a",
        license: "GPL-3.0",
      }
    );
    expect(mockWriteJsonFile).toHaveBeenNthCalledWith(
      4,
      "/tmp/micro-apps/app-b/package.json",
      {
        name: "app-b",
        license: "GPL-3.0",
      }
    );
  });

  it("should ignore if root is unlicensed", () => {
    updateLicense({
      name: "tmp",
      license: "UNLICENSED",
    });
    expect(mockWriteJsonFile).not.toBeCalled();
  });
});
