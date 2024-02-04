import fs from "fs-extra";
import { patchInternalRenovate } from "./patchInternalRenovate";
import { customConsole, LogLevel } from "../customConsole";

jest.mock("fs-extra");
jest.mock("../customConsole");

const mockFsReadJsonSync = fs.readJsonSync as jest.Mock;
const mockFsWriteJsonSync = fs.writeJsonSync as jest.Mock;

describe("patchInternalRenovate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should patch successfully", async () => {
    const filePath = "/tmp/my-repo";
    mockFsReadJsonSync.mockReturnValueOnce({
      packageRules: [
        {
          excludePackagePatterns: ["^@next-core/", "^@next-libs/"],
          enabled: false,
        },
        {
          matchPackagePatterns: ["^@next-core/"],
          matchUpdateTypes: ["major"],
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
    });

    await patchInternalRenovate(filePath);

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Patching")
    );

    expect(mockFsReadJsonSync).toBeCalledWith("/tmp/my-repo/renovate.json");
    expect(mockFsWriteJsonSync).toBeCalledWith(
      "/tmp/my-repo/renovate.json",
      {
        packageRules: [
          {
            excludePackagePatterns: ["^@next-core/", "^@next-libs/"],
            enabled: false,
          },
          {
            matchPackagePatterns: ["^@next-core/"],
            matchUpdateTypes: ["major"],
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
              executionMode: "branch",
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
      },
      {
        spaces: 2,
      }
    );
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.VERBOSE,
      expect.stringContaining("Patched successfully")
    );
  });
});
