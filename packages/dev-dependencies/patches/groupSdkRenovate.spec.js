const mockExistsSync = jest.fn(() => false);

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
}));
jest.mock("../utils");

const groupSdkRenovate = require("./groupSdkRenovate");
const { writeJsonFile, readJson } = require("../utils");

describe("groupSdkRenovate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if it already has sdk group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          groupName: "sdk packages",
        },
      ],
    });
    groupSdkRenovate();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should ignore if it has sdk packages", () => {
    mockExistsSync.mockReturnValueOnce(true);
    groupSdkRenovate();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should add sdk group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          matchDepTypes: ["devDependencies"],
          automerge: true,
        },
      ],
    });
    groupSdkRenovate();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            matchDepTypes: ["devDependencies"],
            automerge: true,
          },
          {
            groupName: "sdk packages",
            matchPackagePatterns: ["^@next-sdk/", "^@sdk/"],
            automerge: false,
          },
        ],
      }
    );
  });
});
