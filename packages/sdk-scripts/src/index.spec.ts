import { main } from "./main";

jest.mock("./main");

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
    expect(spyOnMain).toBeCalledWith("");
  });

  it("should work when a tag specified", () => {
    process.argv = ["yarn", "yo-sdk", "1.0.0"];
    jest.isolateModules(() => {
      require("./");
    });
    expect(spyOnMain).toBeCalledWith("1.0.0");
  });

  it("should work when args invalid", () => {
    process.argv = ["yarn", "yo-sdk", "1.0.0", "2.0.0"];
    const spyOnExit = jest.spyOn(process, "exit").mockImplementation();
    jest.isolateModules(() => {
      require("./");
    });
    expect(spyOnExit).toBeCalledWith(1);
    spyOnExit.mockRestore();
  });
});
