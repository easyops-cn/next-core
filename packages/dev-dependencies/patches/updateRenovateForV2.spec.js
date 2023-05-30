const updateRenovateForV2 = require("./updateRenovateForV2");
const { writeJsonFile, readJson, readSelfJson } = require("../utils");

jest.mock("../utils");

describe("updateRenovateForV2", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update v2 for repo on github", () => {
    readSelfJson.mockReturnValueOnce({
      homepage: "https://github.com/easyops-cn/next-basics",
    });
    readJson.mockReturnValueOnce({
      extends: ["config:base"],
      packageRules: [{}],
    });
    updateRenovateForV2();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        extends: ["config:base"],
        packageRules: [
          {
            excludePackagePatterns: ["^@next-core/", "^@next-libs/"],
            enabled: false,
          },
          {
            groupName: "next-core packages",
            matchPackagePatterns: ["^@next-core/"],
            matchUpdateTypes: ["minor", "patch"],
          },
          {
            groupName: "next-libs packages",
            matchPackagePatterns: ["^@next-libs/"],
            separateMajorMinor: false,
          },
        ],
      }
    );
  });

  it("should update v2 for repo on gitlab", () => {
    readSelfJson.mockReturnValueOnce({
      homepage: "https://git.easyops.local/easyops-cn/next-basics",
    });
    readJson.mockReturnValueOnce({
      extends: ["config:base"],
    });
    updateRenovateForV2();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        extends: ["config:base"],
        packageRules: [
          {
            excludePackagePatterns: ["^@next-core/", "^@next-libs/"],
            enabled: false,
          },
          {
            groupName: "next-core packages",
            matchPackagePatterns: ["^@next-core/"],
            matchUpdateTypes: ["minor", "patch"],
            postUpgradeTasks: {
              commands: [
                "yarn renew",
                "yarn extract",
                "./node_modules/.bin/prettier --write package.json",
                "yarn-deduplicate yarn.lock",
                "yarn",
              ],
              fileFilters: [
                "**/*",
                ".gitignore",
                ".gitlab/**/*",
                ".huskyrc",
                ".husky/.gitignore",
                ".husky/**/*",
              ],
            },
          },
          {
            groupName: "next-libs packages",
            matchPackagePatterns: ["^@next-libs/"],
            separateMajorMinor: false,
          },
        ],
      }
    );
  });
});
