const onlyAutoMergePatchVersions = require("./onlyAutoMergePatchVersions");
const { writeJsonFile, readJson } = require("../utils");

jest.mock("../utils");

describe("onlyAutoMergePatchVersions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if no dev auto merge group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [{}],
    });
    onlyAutoMergePatchVersions();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should ignore if matchUpdateTypes is already patch only", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          matchDepTypes: ["devDependencies"],
          matchUpdateTypes: ["patch"],
          automerge: true,
        },
      ],
    });
    onlyAutoMergePatchVersions();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should update matchUpdateTypes", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          matchDepTypes: ["devDependencies"],
          matchUpdateTypes: ["minior", "patch"],
          automerge: true,
        },
      ],
    });
    onlyAutoMergePatchVersions();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            matchDepTypes: ["devDependencies"],
            matchUpdateTypes: ["patch"],
            automerge: true,
          },
        ],
      }
    );
  });
});
