const updateRenovatePostExecutionMode = require("./updateRenovatePostExecutionMode");
const { writeJsonFile, readJson } = require("../utils");

jest.mock("../utils");

describe("updateRenovatePostExecutionMode", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if no postUpgradeTasks", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          groupName: "next-core packages",
        },
      ],
    });
    updateRenovatePostExecutionMode();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should update fileFilters", () => {
    readJson.mockReturnValueOnce({
      postUpgradeTasks: {
        commands: ["yarn renew"],
      },
    });
    updateRenovatePostExecutionMode();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        postUpgradeTasks: {
          commands: ["yarn renew"],
          executionMode: "branch",
        },
      }
    );
  });
});
