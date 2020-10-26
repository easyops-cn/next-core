const tree = {
  "/tmp/bricks": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "brick-a",
      isDirectory: () => true,
    },
    {
      name: "brick-b",
      isDirectory: () => true,
    },
    {
      name: "brick-c",
      isDirectory: () => true,
    },
  ],
};

const contents = {
  "/tmp/bricks/brick-a/deploy-default/package.conf.yaml": `install_path: /usr/local/easyops/bricks/brick-a-NB
user: easyops:easyops
dependencies:
  - name: brick_next
    version: "^2.0.1"
    local_deploy: true
`,
  // This package has unexpected version of brick_next.
  "/tmp/bricks/brick-b/deploy-default/package.conf.yaml": `install_path: /usr/local/easyops/bricks/brick-b-NB
user: easyops:easyops
dependencies:
- name: brick_next
  version: "^1.2.3"
  local_deploy: true
`,
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
const mockReadJsonSync = jest.fn((filePath) =>
  filePath.includes("brick-c")
    ? {}
    : {
        devDependencies: {
          "@easyops/custom-antd-styles": "*",
        },
      }
);

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
  outputFileSync: mockOutputFileSync,
  readJsonSync: mockReadJsonSync,
}));

jest.mock("path", () => ({
  resolve: (dir) => `/tmp/${dir}`,
  join: (...paths) => paths.join("/"),
}));

jest.mock("@easyops/brick-container/package.json", () => ({
  version: "2.3.4",
}));

const consoleLog = jest.spyOn(console, "log").mockImplementation(() => void 0);

const updateBrickNextForNewCssVariables = require("./updateBrickNextForNewCssVariables");

describe("updateBrickNextForNewCssVariables", () => {
  it("should work", () => {
    updateBrickNextForNewCssVariables();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(1);
    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/bricks/brick-a/deploy-default/package.conf.yaml",
      `install_path: /usr/local/easyops/bricks/brick-a-NB
user: 'easyops:easyops'
dependencies:
  - name: brick_next
    version: ^2.3.4
    local_deploy: true
`
    );
    expect(consoleLog).toBeCalledTimes(1);
    expect(consoleLog).toBeCalledWith(
      expect.stringContaining("Unexpected brick next version")
    );
  });
});
