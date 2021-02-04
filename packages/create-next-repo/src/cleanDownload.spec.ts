import fs from "fs";
import { cleanDownload } from "./cleanDownload";
import { customConsole, LogLevel } from "./customConsole";

jest.mock("fs");
jest.mock("./customConsole");

const mockFsUnlink = fs.unlink as jest.MockedFunction<typeof fs.unlink>;

describe("cleanDownload", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should clean successfully", async () => {
    const filePath = "/tmp.zip";
    mockFsUnlink.mockImplementationOnce((filePath, callback) => {
      setTimeout(() => {
        callback(null);
      }, 100);
    });

    const promise = cleanDownload(filePath);

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Cleaning")
    );

    // Advance timers to trigger unlink callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.VERBOSE,
      expect.stringContaining("successfully")
    );

    await promise;
  });

  it("should failed to clean", () => {
    const filePath = "/tmp.zip";
    const cleanError = new Error("oops");
    mockFsUnlink.mockImplementationOnce((filePath, callback) => {
      setTimeout(() => {
        callback(cleanError);
      }, 100);
    });

    const promise = cleanDownload(filePath);

    expect(promise).rejects.toBe(cleanError);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Cleaning")
    );

    // Advance timers to trigger unlink callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.error).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("Failed")
    );
  });
});
