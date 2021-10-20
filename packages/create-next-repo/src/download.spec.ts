import fs from "fs";
import http from "http";
import https from "https";
import createHttpsProxyAgent from "https-proxy-agent";
import { download } from "./download";
import { customConsole, LogLevel } from "./customConsole";
import { cleanDownload } from "./cleanDownload";

jest.mock("fs");
jest.mock("http");
jest.mock("https");
jest.mock("http-proxy-agent");
jest.mock("https-proxy-agent");
jest.mock("./customConsole");
jest.mock("./cleanDownload");

const mockHttpGet = http.get as jest.MockedFunction<typeof http.get>;
const mockHttpsGet = https.get as jest.MockedFunction<typeof https.get>;
const mockFsCreateWriteStream = fs.createWriteStream as jest.MockedFunction<
  typeof fs.createWriteStream
>;
const mockCleanDownload = cleanDownload as jest.MockedFunction<
  typeof cleanDownload
>;

const mockProxyAgent = {} as any;
(createHttpsProxyAgent as any as jest.Mock).mockReturnValue(mockProxyAgent);

describe("download", () => {
  // Mocking `process.env`.
  // See https://stackoverflow.com/a/48042799
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it("should download successfully", async () => {
    const mockRequest = {
      on: jest.fn(),
    } as any;
    const mockResponse = {
      pipe: jest.fn(),
    } as any;
    const mockWriteStream = {
      on: jest.fn((event, listener) => {
        setTimeout(listener, 100);
      }),
    } as any;
    mockFsCreateWriteStream.mockReturnValueOnce(mockWriteStream);
    mockHttpsGet.mockImplementationOnce((url, options, callback) => {
      setTimeout(() => {
        callback(mockResponse);
      }, 100);
      return mockRequest;
    });

    const promise = download("https://example.com/master.zip", "/tmp.zip");

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.DEFAULT,
      expect.stringContaining("Downloading")
    );
    expect(mockFsCreateWriteStream).toBeCalledWith("/tmp.zip");
    expect(mockHttpsGet).toBeCalledWith(
      "https://example.com/master.zip",
      {
        timeout: 6e4,
      },
      expect.any(Function)
    );

    // Advance timers to trigger http get callback.
    jest.advanceTimersByTime(100);
    expect(mockResponse.pipe).toBeCalledWith(mockWriteStream);
    expect(mockWriteStream.on).toBeCalledWith("finish", expect.any(Function));

    // Advance timers to trigger write stream finish callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.DEFAULT,
      expect.stringContaining("successfully")
    );

    await promise;
  });

  it("should download successfully with http", async () => {
    const mockRequest = {
      on: jest.fn(),
    } as any;
    const mockResponse = {
      pipe: jest.fn(),
    } as any;
    const mockWriteStream = {
      on: jest.fn((event, listener) => {
        setTimeout(listener, 100);
      }),
    } as any;
    mockFsCreateWriteStream.mockReturnValueOnce(mockWriteStream);
    mockHttpGet.mockImplementationOnce((url, options, callback) => {
      setTimeout(() => {
        callback(mockResponse);
      }, 100);
      return mockRequest;
    });

    const promise = download("http://example.com/master.zip", "/tmp.zip");

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.DEFAULT,
      expect.stringContaining("Downloading")
    );
    expect(mockFsCreateWriteStream).toBeCalledWith("/tmp.zip");
    expect(mockHttpGet).toBeCalledWith(
      "http://example.com/master.zip",
      {
        timeout: 6e4,
      },
      expect.any(Function)
    );

    // Advance timers to trigger http get callback.
    jest.advanceTimersByTime(100);
    expect(mockResponse.pipe).toBeCalledWith(mockWriteStream);
    expect(mockWriteStream.on).toBeCalledWith("finish", expect.any(Function));

    // Advance timers to trigger write stream finish callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.log).toHaveBeenNthCalledWith(
      2,
      LogLevel.DEFAULT,
      expect.stringContaining("successfully")
    );

    await promise;
  });

  it("should fail to download", async () => {
    const requestError = new Error("oops");
    const mockRequest = {
      on: jest.fn((event, listener) => {
        setTimeout(() => {
          listener(requestError);
        }, 100);
      }),
    } as any;
    mockHttpsGet.mockReturnValueOnce(mockRequest);
    const cleanError = new Error("yaks");
    mockCleanDownload.mockRejectedValueOnce(cleanError);

    const promise = download("https://example.com/master.zip", "/tmp.zip");

    expect(promise).rejects.toBe(requestError);
    expect(mockRequest.on).toBeCalledWith("error", expect.any(Function));

    // Advance timers to trigger http on error callback.
    jest.advanceTimersByTime(100);
    expect(customConsole.error).toHaveBeenNthCalledWith(
      1,
      LogLevel.DEFAULT,
      expect.stringContaining("Failed")
    );
    expect(cleanDownload).toBeCalledWith("/tmp.zip");

    // Flush promises to trigger `cleanDownload()` rejection.
    await (global as any).flushPromises();
    expect(customConsole.error).toHaveBeenNthCalledWith(
      2,
      LogLevel.VERBOSE,
      cleanError
    );
  });

  it("should use proxy", async () => {
    process.env.HTTPS_PROXY = "https://localhost:1080";
    const mockRequest = {
      on: jest.fn(),
    } as any;
    mockHttpsGet.mockReturnValueOnce(mockRequest);

    download("https://example.com/master.zip", "/tmp.zip");

    expect(customConsole.log).toHaveBeenNthCalledWith(
      1,
      LogLevel.VERBOSE,
      expect.stringContaining("proxy")
    );
    expect(mockHttpsGet).toBeCalledWith(
      "https://example.com/master.zip",
      {
        timeout: 6e4,
        agent: mockProxyAgent,
      },
      expect.any(Function)
    );
  });
});
