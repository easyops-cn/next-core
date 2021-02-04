import { replaceInFile } from "replace-in-file";
import { replaceCommentSectionsInWorkflows } from "./replaceCommentSectionsInWorkflows";
import { customConsole, LogLevel } from "../customConsole";

jest.mock("replace-in-file");
jest.mock("../customConsole");

const mockReplaceInFile = replaceInFile as jest.Mock;

describe("replaceCommentSectionsInWorkflows", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should replace successfully", async () => {
    mockReplaceInFile.mockResolvedValueOnce(null);

    await replaceCommentSectionsInWorkflows("/tmp/my-repo");

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Replacing")
    );
    expect(replaceInFile).toBeCalledWith({
      files: "/tmp/my-repo/.github/workflows/ci.yml",
      from: expect.any(RegExp),
      to: expect.any(Function),
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

    await expect(
      replaceCommentSectionsInWorkflows("/tmp/my-repo")
    ).rejects.toBe(replaceError);

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
