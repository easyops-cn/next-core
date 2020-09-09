const tree = {
  "/tmp/micro-apps": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "app-a",
      isDirectory: () => true,
    },
  ],
  "/tmp/templates": [
    {
      name: "tpl-a",
      isDirectory: () => true,
    },
    {
      name: "tpl-b",
      isDirectory: () => true,
    },
  ],
};

const contents = {
  "/tmp/micro-apps/app-a/deploy-default/package.conf.yaml": `install_path: /usr/local/easyops/applications/app-a-NA
user: easyops:easyops
dependencies:
  - name: brick_next
    version: "^1.0.0"
    local_deploy: true
`,
  // This template package has already been patched with ` || ^2.0.0`.
  "/tmp/templates/tpl-a/deploy-default/package.conf.yaml": `install_path: /usr/local/easyops/templates/tpl-a-NT
user: easyops:easyops
dependencies:
  - name: brick_next
    version: "^1.2.3 || ^2.0.0"
    local_deploy: true
`,
  "/tmp/templates/tpl-b/deploy-default/package.conf.yaml": `install_path: /usr/local/easyops/templates/tpl-b-NT
user: easyops:easyops
dependencies:
  - name: brick_next
    version: "^1.3.4"
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

const { updateVersionOfBrickNext } = require("./majorBrickNext");

describe("updateVersionOfBrickNext", () => {
  it("should work", () => {
    updateVersionOfBrickNext();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(2);
    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/micro-apps/app-a/deploy-default/package.conf.yaml",
      `install_path: /usr/local/easyops/applications/app-a-NA
user: 'easyops:easyops'
dependencies:
  - name: brick_next
    version: ^1.0.0 || ^2.0.0
    local_deploy: true
`
    );
    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      2,
      "/tmp/templates/tpl-b/deploy-default/package.conf.yaml",
      `install_path: /usr/local/easyops/templates/tpl-b-NT
user: 'easyops:easyops'
dependencies:
  - name: brick_next
    version: ^1.3.4 || ^2.0.0
    local_deploy: true
`
    );
  });
});
