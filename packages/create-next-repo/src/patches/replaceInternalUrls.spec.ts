import { replaceInFile } from "replace-in-file";
import { replaceInternalUrls } from "./replaceInternalUrls";
import { customConsole, LogLevel } from "../customConsole";

jest.mock("replace-in-file");
jest.mock("../customConsole");

const mockReplaceInFile = replaceInFile as jest.Mock;

describe("replaceInternalUrls", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should replace successfully", async () => {
    mockReplaceInFile.mockResolvedValueOnce(null);

    await replaceInternalUrls("/tmp/my-repo");

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Replacing")
    );
    expect(replaceInFile).toBeCalledWith({
      files: [
        "/tmp/my-repo/package.json",
        "/tmp/my-repo/README.md",
        "/tmp/my-repo/lerna.json",
      ],
      from: ["https://github.com/easyops-cn/", "https://registry.npmjs.org"],
      to: [
        "https://git.easyops.local/anyclouds/",
        "https://registry.npm.easyops.local",
      ],
    });
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.VERBOSE,
      expect.stringContaining("successfully")
    );
  });

  it("should failed to replace", async () => {
    const replaceError = new Error("oops");
    mockReplaceInFile.mockReturnValueOnce(Promise.reject(replaceError));

    await expect(replaceInternalUrls("/tmp/my-repo")).rejects.toBe(
      replaceError
    );

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Replacing")
    );
    expect(customConsole.error).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Failed")
    );
  });
});
