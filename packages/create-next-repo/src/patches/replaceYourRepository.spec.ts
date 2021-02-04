import { replaceInFile } from "replace-in-file";
import { replaceYourRepository } from "./replaceYourRepository";
import { customConsole, LogLevel } from "../customConsole";

jest.mock("replace-in-file");
jest.mock("../customConsole");

const mockReplaceInFile = replaceInFile as jest.Mock;

describe("replaceYourRepository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should replace successfully", async () => {
    mockReplaceInFile.mockResolvedValueOnce(null);

    await replaceYourRepository("/tmp/my-repo");

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Replacing")
    );
    expect(replaceInFile).toBeCalledWith({
      files: ["/tmp/my-repo/package.json", "/tmp/my-repo/README.md"],
      from: /\bYOUR-REPOSITORY\b/g,
      to: "my-repo",
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

    await expect(replaceYourRepository("/tmp/my-repo")).rejects.toBe(
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
