const updateLernaAllowBranch = require("./updateLernaAllowBranch");
const { writeJsonFile, readJson } = require("../utils");

jest.mock("../utils");

describe("updateLernaAllowBranch", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add legacy branches", () => {
    readJson.mockReturnValueOnce({
      command: {
        publish: {
          allowBranch: "master",
        },
      },
    });
    updateLernaAllowBranch();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("lerna.json"),
      {
        command: {
          publish: {
            allowBranch: ["master", "legacy/**"],
          },
        },
      }
    );
  });

  it("should ignore if legacy branches existed", () => {
    readJson.mockReturnValueOnce({
      command: {
        publish: {
          allowBranch: ["master", "legacy/**"],
        },
      },
    });
    updateLernaAllowBranch();
    expect(writeJsonFile).not.toBeCalled();
  });
});
