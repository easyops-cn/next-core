import fs from "fs";
import StreamZip from "node-stream-zip";
import { extract } from "./extract";
import { customConsole, LogLevel } from "./customConsole";

jest.mock("fs");
jest.mock("node-stream-zip");
jest.mock("./customConsole");

const mockFsMkdirSync = fs.mkdirSync as jest.MockedFunction<
  typeof fs.mkdirSync
>;
const mockStreamZip = StreamZip as jest.MockedClass<typeof StreamZip>;

describe("extract", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should extract successfully", async () => {
    const src = "/tmp.zip";
    const dest = "/tmp";

    const promise = extract(src, dest);

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.DEFAULT,
      expect.stringContaining("Extracting")
    );

    const mockZip = mockStreamZip.mock.instances[0];
    const mockZipOn = mockZip.on as jest.MockedFunction<typeof mockZip.on>;
    expect(mockZipOn).toBeCalledWith("ready", expect.any(Function));

    const mockOnReadyListener = mockZipOn.mock.calls[0][1] as () => void;
    mockZip.entries = () => ({
      "master/": {} as any,
      "master/package.json": {} as any,
    });
    // const mockZipExtract = (mockZip.extract as jest.MockedFunction<typeof mockZip.extract>);
    mockZip.extract = jest.fn((entry, dest, callback) => {
      setTimeout(() => {
        callback();
      }, 100);
    });
    mockZip.close = jest.fn();

    // Trigger zip ready callback.
    mockOnReadyListener();
    expect(mockFsMkdirSync).toBeCalledWith("/tmp");
    expect(mockZip.extract).toBeCalledWith(
      "master/",
      "/tmp",
      expect.any(Function)
    );

    // Advance timers to trigger zip extract callback.
    jest.advanceTimersByTime(100);
    expect(mockZip.close).toBeCalled();
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.DEFAULT,
      expect.stringContaining("successfully")
    );

    await promise;
  });

  it("should failed to extract", async () => {
    const src = "/tmp.zip";
    const dest = "/tmp";
    const mockZipError = new Error("oops");

    const promise = extract(src, dest);

    expect(promise).rejects.toBe(mockZipError);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.DEFAULT,
      expect.stringContaining("Extracting")
    );

    const mockZip = mockStreamZip.mock.instances[0];
    const mockZipOn = mockZip.on as jest.MockedFunction<typeof mockZip.on>;
    expect(mockZipOn).toBeCalledWith("ready", expect.any(Function));

    const mockOnReadyListener = mockZipOn.mock.calls[0][1] as () => void;
    mockZip.entries = () => ({
      "master/": {} as any,
      "master/package.json": {} as any,
    });
    mockZip.extract = jest.fn((entry, dest, callback) => {
      setTimeout(() => {
        callback(mockZipError);
      }, 100);
    });
    mockZip.close = jest.fn();

    // Trigger zip ready callback.
    mockOnReadyListener();
    expect(mockFsMkdirSync).toBeCalledWith("/tmp");
    expect(mockZip.extract).toBeCalledWith(
      "master/",
      "/tmp",
      expect.any(Function)
    );

    // Advance timers to trigger zip extract callback.
    jest.advanceTimersByTime(100);
    expect(mockZip.close).toBeCalled();
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.DEFAULT,
      expect.stringContaining("Failed")
    );
  });
});
