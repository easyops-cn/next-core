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
  // This package has newer version of brick_next.
  "/tmp/bricks/brick-b/deploy-default/package.conf.yaml": `install_path: /usr/local/easyops/bricks/brick-b-NB
user: easyops:easyops
dependencies:
- name: brick_next
  version: "^2.30.0"
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
  resolve: jest.fn((dir) => `/tmp/${dir}`),
  join: (...paths) => paths.join("/"),
}));

const updateBrickNext = require("./updateBrickNext");

describe("updateBrickNext", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", () => {
    updateBrickNext();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(1);
    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/bricks/brick-a/deploy-default/package.conf.yaml",
      `install_path: /usr/local/easyops/bricks/brick-a-NB
user: 'easyops:easyops'
dependencies:
  - name: brick_next
    version: ^2.29.11
    local_deploy: true
`
    );
  });

  it("should do nothing if package dir does not exist", () => {
    mockExistsSync.mockReturnValueOnce(false);
    updateBrickNext();
    expect(mockOutputFileSync).not.toHaveBeenCalled();
  });
});
