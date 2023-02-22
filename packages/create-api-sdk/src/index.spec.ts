import { describe, it, expect } from "@jest/globals";
import { main } from "./main.js";

jest.mock("./main.js");
jest.mock("./loaders/__dirname.js");

const spyOnMain = main as jest.Mock;

describe("index", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work when no tag specified", () => {
    process.argv = ["yarn", "yo-sdk"];
    jest.isolateModules(() => {
      require("./");
    });
    expect(spyOnMain).toBeCalledWith(undefined, {});
  });

  it("should work when a tag specified", () => {
    process.argv = ["yarn", "yo-sdk", "1.0.0"];
    jest.isolateModules(() => {
      require("./");
    });
    expect(spyOnMain).toBeCalledWith("1.0.0", {});
  });

  it("should work when a tag specified", () => {
    process.argv = ["yarn", "yo-sdk", "--sdk=test"];
    jest.isolateModules(() => {
      require("./");
    });
    expect(spyOnMain).toBeCalledWith(undefined, { sdk: "test" });
  });

  it("should work when args invalid", () => {
    process.argv = ["yarn", "yo-sdk", "1.0.0", "2.0.0"];
    const spyOnExit = jest.spyOn(process, "exit").mockImplementation();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => void 0);
    jest.isolateModules(() => {
      require("./");
    });
    expect(spyOnExit).toBeCalledWith(2);
    expect(consoleError).toBeCalled();
    spyOnExit.mockRestore();
    consoleError.mockRestore();
  });
});
