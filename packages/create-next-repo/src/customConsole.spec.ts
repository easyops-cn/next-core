import { customConsole, LogLevel, setLogLevel } from "./customConsole";

const consoleLog = jest.spyOn(console, "log").mockImplementation(() => void 0);
const consoleError = jest.spyOn(console, "error").mockImplementation(() => void 0);

describe("customConsole", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not log verbose be default", () => {
    setLogLevel(LogLevel.DEFAULT);
    customConsole.log(LogLevel.DEFAULT, "hello", "world");
    customConsole.error(LogLevel.DEFAULT, "oops");
    customConsole.log(LogLevel.VERBOSE, "foo", "bar");
    expect(consoleLog).toBeCalledTimes(1);
    expect(consoleLog).toBeCalledWith("hello", "world");
    expect(consoleError).toBeCalledWith("oops");
  });

  it("should not log verbose", () => {
    setLogLevel(LogLevel.VERBOSE);
    customConsole.log(LogLevel.DEFAULT, "hello", "world");
    customConsole.log(LogLevel.VERBOSE, "foo", "bar");
    expect(consoleLog).toBeCalledTimes(2);
    expect(consoleLog).toBeCalledWith("hello", "world");
    expect(consoleLog).toBeCalledWith("foo", "bar");
  });
})
