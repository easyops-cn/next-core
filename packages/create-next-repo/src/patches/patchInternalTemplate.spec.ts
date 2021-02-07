import fs from "fs-extra";
import { patchInternalTemplate } from "./patchInternalTemplate";
import { customConsole, LogLevel } from "../customConsole";

jest.mock("fs-extra");
jest.mock("../customConsole");

const mockFsCopy = fs.copy as jest.Mock;
const mockFsReadJSONSync = fs.readJSONSync as jest.Mock;

describe("patchInternalTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should patch successfully", async () => {
    const filePath = "/tmp/my-repo";
    mockFsCopy.mockImplementationOnce((filePath, dest, callback) => {
      setTimeout(() => {
        callback(null);
      }, 100);
    });
    mockFsReadJSONSync.mockReturnValueOnce({
      name: "my-repo",
      license: "GPL-3.0",
    });

    const promise = patchInternalTemplate(filePath);

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Removing")
    );
    expect(fs.removeSync).toBeCalledWith("/tmp/my-repo/.github");
    expect(fs.removeSync).toBeCalledWith("/tmp/my-repo/.easyops-yo.json");
    expect(fs.removeSync).toBeCalledWith("/tmp/my-repo/COPYING");
    expect(fs.readJSONSync).toBeCalledWith("/tmp/my-repo/package.json");
    expect(fs.writeJSONSync).toBeCalledWith("/tmp/my-repo/package.json", {
      name: "my-repo",
      license: "UNLICENSED",
    });
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.VERBOSE,
      expect.stringContaining("Removed successfully")
    );

    expect(customConsole.log).toHaveBeenNthCalledWith(
      3,
      LogLevel.VERBOSE,
      expect.stringContaining("Creating")
    );

    // Advance timers to trigger unlink callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      4,
      LogLevel.VERBOSE,
      expect.stringContaining("Created successfully")
    );

    await promise;
  });

  it("should failed to patch", () => {
    const filePath = "/tmp/my-repo";
    const cleanError = new Error("oops");
    mockFsCopy.mockImplementationOnce((filePath, dest, callback) => {
      setTimeout(() => {
        callback(cleanError);
      }, 100);
    });

    const promise = patchInternalTemplate(filePath);

    expect(promise).rejects.toBe(cleanError);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      3,
      LogLevel.VERBOSE,
      expect.stringContaining("Creating")
    );

    // Advance timers to trigger unlink callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.error).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Failed to create")
    );
  });
});
