const updateRenovateExecutionMode = require("./updateRenovateExecutionMode");
const { writeJsonFile, readJson } = require("../utils");

jest.mock("../utils");

describe("updateRenovateExecutionMode", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if no next core group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [{}],
    });
    updateRenovateExecutionMode();
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
    updateRenovateExecutionMode();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should update executionMode", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          groupName: "next-core packages",
          postUpgradeTasks: {
            commands: [],
          },
        },
      ],
    });
    updateRenovateExecutionMode();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            groupName: "next-core packages",
            postUpgradeTasks: {
              commands: [],
              executionMode: "branch",
            },
          },
        ],
      }
    );
  });
});
