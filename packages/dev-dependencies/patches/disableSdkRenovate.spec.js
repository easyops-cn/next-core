jest.mock("../utils");

const disableSdkRenovate = require("./disableSdkRenovate");
const { writeJsonFile, readJson } = require("../utils");

describe("disableSdkRenovate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if no updates group", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          matchDepTypes: ["devDependencies"],
          matchUpdateTypes: ["minor", "patch"],
          automerge: true,
        },
      ],
    });
    disableSdkRenovate();
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
          matchPackagePatterns: ["^@next-bricks/", "^@next-sdk/", "^@bricks/"],
          matchPackageNames: ["react"],
          enabled: false,
        },
        {
          matchUpdateTypes: ["major"],
          enabled: false,
        },
        {
          groupName: "sdk packages",
          matchPackagePatterns: ["^@next-sdk/", "^@sdk/"],
          automerge: false,
        },
      ],
    });
    disableSdkRenovate();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            matchDepTypes: ["devDependencies"],
            matchUpdateTypes: ["minor", "patch"],
            automerge: true,
          },
          {
            matchPackagePatterns: [
              "^@next-bricks/",
              "^@next-sdk/",
              "^@bricks/",
              "^@libs/",
              "^@micro-apps/",
              "^@sdk/",
              "^@templates/",
              "^@next-libs/",
              "^@next-micro-apps/",
              "^@next-legacy-templates/",
            ],
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
