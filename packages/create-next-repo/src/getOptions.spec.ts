import fs from "fs";
import os from "os";
import meow from "meow";
import { getOptions } from "./getOptions";

jest.mock("fs");
jest.mock("os");
jest.mock("meow");

const mockFsExistsSync = fs.existsSync as jest.MockedFunction<
  typeof fs.existsSync
>;
(os.tmpdir as jest.MockedFunction<typeof os.tmpdir>).mockReturnValue("/tmp");
const mockMeow = meow as jest.MockedFunction<typeof meow>;

describe("getOptions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", () => {
    mockMeow.mockReturnValueOnce({
      input: ["/home/my-repo"],
      flags: {
        internal: false,
        verbose: false,
      },
    } as any);
    mockFsExistsSync.mockReturnValueOnce(false);

    expect(getOptions()).toEqual({
      internal: false,
      repoDir: "/home/my-repo",
      templateRepoZipUrl:
        "https://codeload.github.com/easyops-cn/next-template-repo/zip/master",
      verbose: false,
      zipFilePath: expect.stringMatching(
        /^\/tmp\/next-template-repo-\d+\.zip$/
      ),
    });
  });

  it("should show help if input is empty", () => {
    const helpError = new Error("help");
    mockMeow.mockReturnValueOnce({
      input: [],
      flags: {
        internal: false,
        verbose: false,
      },
      showHelp() {
        throw helpError;
      },
    } as any);
    expect(getOptions).toThrowError(helpError);
  });

  it("should show help if input is greater than 1", () => {
    const helpError = new Error("help");
    mockMeow.mockReturnValueOnce({
      input: ["/home/my-repo", "/home/another-repo"],
      flags: {
        internal: false,
        verbose: false,
      },
      showHelp() {
        throw helpError;
      },
    } as any);
    expect(getOptions).toThrowError(helpError);
  });

  it("should throw if directory existed", () => {
    mockMeow.mockReturnValueOnce({
      input: ["/home/my-repo"],
      flags: {
        internal: false,
        verbose: false,
      },
    } as any);
    mockFsExistsSync.mockReturnValueOnce(true);

    expect(getOptions).toThrowError();
  });

  it("should throw if repo name is not lower-kebab-case", () => {
    mockMeow.mockReturnValueOnce({
      input: ["/home/myRepo"],
      flags: {
        internal: false,
        verbose: false,
      },
    } as any);
    mockFsExistsSync.mockReturnValueOnce(false);

    expect(getOptions).toThrowError();
  });
});
