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
          matchDepTypes: ["devDependencies"],
          matchUpdateTypes: ["minor", "patch"],
          automerge: true,
        },
        {
          groupName: "next-core packages",
          matchPackagePatterns: ["^@next-core/"],
          automerge: false,
        },
        {
          matchPackagePatterns: ["^@next-core/"],
          matchUpdateTypes: ["major"],
          enabled: false,
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
            matchDepTypes: ["devDependencies"],
            matchUpdateTypes: ["minor", "patch"],
            automerge: true,
          },
          {
            groupName: "next-core packages",
            matchPackagePatterns: ["^@next-core/"],
            automerge: false,
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
            matchPackagePatterns: ["^@next-core/"],
            matchUpdateTypes: ["major"],
            enabled: false,
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
