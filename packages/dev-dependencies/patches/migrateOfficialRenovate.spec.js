const mockExistsSync = jest.fn(() => false);

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
}));
jest.mock("../utils");

const migrateOfficialRenovate = require("./migrateOfficialRenovate");
const { writeJsonFile, readJson } = require("../utils");

describe("migrateOfficialRenovate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should ignore if nothing to migrate", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          groupName: "any",
        },
      ],
    });
    migrateOfficialRenovate();
    expect(writeJsonFile).not.toBeCalled();
  });

  it("should migrate package rules", () => {
    readJson.mockReturnValueOnce({
      packageRules: [
        {
          depTypeList: ["devDependencies"],
          automerge: true,
        },
        {
          packagePatterns: ["^@next-bricks/"],
          packageNames: ["react"],
          enabled: false,
        },
        {
          matchUpdateTypes: ["major"],
          enabled: false,
        },
      ],
    });
    migrateOfficialRenovate();
    expect(writeJsonFile).toBeCalledWith(
      expect.stringContaining("renovate.json"),
      {
        packageRules: [
          {
            matchDepTypes: ["devDependencies"],
            automerge: true,
          },
          {
            matchPackagePatterns: ["^@next-bricks/"],
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
