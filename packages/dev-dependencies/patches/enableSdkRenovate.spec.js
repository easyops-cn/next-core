const mockExistsSync = jest.fn(() => false);

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
}));
jest.mock("../utils");

const enableSdkRenovate = require("./enableSdkRenovate");
const { writeJsonFile, readJson } = require("../utils");

describe("enableSdkRenovate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if no disabled group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [{}],
    });
    enableSdkRenovate();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should ignore if it has sdk packages", () => {
    mockExistsSync.mockReturnValueOnce(true);
    enableSdkRenovate();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should remove sdk from disabled group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          matchDepTypes: ["devDependencies"],
          automerge: true,
        },
        {
          matchPackagePatterns: [
            "^@next-bricks/",
            "^@next-sdk/",
            "^@bricks/",
            "^@sdk/",
          ],
          matchPackageNames: ["react"],
          enabled: false,
        },
        {
          matchUpdateTypes: ["major"],
          enabled: false,
        },
      ],
    });
    enableSdkRenovate();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            matchDepTypes: ["devDependencies"],
            automerge: true,
          },
          {
            matchPackagePatterns: ["^@next-bricks/", "^@bricks/"],
            matchPackageNames: ["react"],
            enabled: false,
          },
          {
            matchUpdateTypes: ["major"],
            enabled: false,
          },
        ],
      }
    );
  });
});
