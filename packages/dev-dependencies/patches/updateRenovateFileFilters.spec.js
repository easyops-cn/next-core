const updateRenovateFileFilters = require("./updateRenovateFileFilters");
const { writeJsonFile, readJson } = require("../utils");

jest.mock("../utils");

describe("updateRenovateFileFilters", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if no next core group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [{}],
    });
    updateRenovateFileFilters();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should ignore if no postUpgradeTasks", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          groupName: "next-core packages",
        },
      ],
    });
    updateRenovateFileFilters();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should update fileFilters", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          groupName: "next-core packages",
          postUpgradeTasks: {
            commands: [],
            fileFilters: ["**/*"],
          },
        },
      ],
    });
    updateRenovateFileFilters();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            groupName: "next-core packages",
            postUpgradeTasks: {
              commands: [],
              fileFilters: ["**/*", ".gitlab/**/*"],
            },
          },
        ],
      }
    );
  });
});
