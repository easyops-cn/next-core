const removeRenovateLegacyBaseBranches = require("./removeRenovateLegacyBaseBranches");
const { writeJsonFile, readJson } = require("../utils");

jest.mock("../utils");

describe("removeRenovateLegacyBaseBranches", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if nothing to remove", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          groupName: "any",
        },
      ],
    });
    removeRenovateLegacyBaseBranches();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should remove legacy from baseBranches", () => {
    readJson.mockReturnValueOnce({
      baseBranches: ["master", "legacy/brick-next_1.x"],
      packageRules: [
        {
          depTypeList: ["devDependencies"],
          automerge: true,
        },
        {
          matchBaseBranches: ["legacy/brick-next_1.x"],
          automerge: false,
        },
      ],
    });
    removeRenovateLegacyBaseBranches();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            depTypeList: ["devDependencies"],
            automerge: true,
          },
        ],
      }
    );
  });
});
