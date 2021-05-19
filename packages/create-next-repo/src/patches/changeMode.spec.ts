import fs from "fs-extra";
import { changeMode } from "./changeMode";
import { customConsole, LogLevel } from "../customConsole";

jest.mock("fs-extra");
jest.mock("../customConsole");

const mockFsExistsSync = fs.existsSync as jest.Mock;
const mockFsChmodSync = fs.chmod as jest.Mock;

describe("changeMode", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should patch successfully", async () => {
    const filePath = "/tmp/my-repo";
    mockFsExistsSync.mockReturnValueOnce(true);
    mockFsChmodSync.mockImplementationOnce((filePath, mode, callback) => {
      setTimeout(() => {
        callback(null);
      }, 100);
    });

    const promise = changeMode(filePath);

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Changing mode")
    );
    expect(mockFsExistsSync).toBeCalledWith("/tmp/my-repo/.husky/pre-commit");
    expect(customConsole.warn).not.toBeCalled();
    expect(mockFsChmodSync).toBeCalledWith(
      "/tmp/my-repo/.husky/pre-commit",
      0o755,
      expect.any(Function)
    );

    // Advance timers to trigger unlink callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.VERBOSE,
      expect.stringContaining("Mode changed successfully")
    );

    await promise;
  });

  it("should warn if certain file does not exist", async () => {
    const filePath = "/tmp/my-repo";
    mockFsExistsSync.mockReturnValueOnce(false);

    const promise = changeMode(filePath);

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Changing mode")
    );
    expect(mockFsExistsSync).toBeCalledWith("/tmp/my-repo/.husky/pre-commit");
    expect(customConsole.warn).toBeCalledWith(
      LogLevel.VERBOSE,
      expect.stringContaining("File to be changed doesn't exist")
    );
    expect(mockFsChmodSync).not.toBeCalled();

    // Advance timers to trigger unlink callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.log).toBeCalledTimes(1);

    await promise;
  });

  it("should failed to change mode", () => {
    const filePath = "/tmp/my-repo";
    const chmodError = new Error("oops");
    mockFsExistsSync.mockReturnValueOnce(true);
    mockFsChmodSync.mockImplementationOnce((filePath, mode, callback) => {
      setTimeout(() => {
        callback(chmodError);
      }, 100);
    });

    const promise = changeMode(filePath);

    expect(promise).rejects.toBe(chmodError);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Changing mode")
    );
    expect(customConsole.warn).not.toBeCalled();

    // Advance timers to trigger unlink callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.error).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Failed to change mode")
    );
  });
});
