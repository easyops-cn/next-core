import { _dev_only_getAllContextValues } from "./Runtime";
import {
  addRealTimeDataInspectHook,
  setRealTimeDataInspectRoot,
} from "./realTimeDataInspect";

jest.mock("./Runtime", () => ({
  _dev_only_getAllContextValues: jest.fn(
    () =>
      new Map([
        [
          "a",
          {
            type: "free-variable",
            value: "good",
          },
        ],
        [
          "b",
          {
            type: "brick-property",
            value: "ignored",
          },
        ],
      ])
  ),
}));

const consoleError = jest.spyOn(console, "error").mockImplementation();

describe("realTimeDataInspect", () => {
  test("hook", () => {
    const hook = jest.fn();
    addRealTimeDataInspectHook(hook);
    setRealTimeDataInspectRoot({});
    expect(_dev_only_getAllContextValues).toHaveBeenCalledWith({});
    jest.advanceTimersByTime(0);
    expect(hook).toHaveBeenCalledWith({
      changeType: "initialize",
      tplStateStoreId: undefined,
      detail: { data: { a: "good" } },
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("hook throws", () => {
    const hook = jest.fn(() => {
      throw new Error("oops");
    });
    addRealTimeDataInspectHook(hook);
    setRealTimeDataInspectRoot({});
    expect(_dev_only_getAllContextValues).toHaveBeenCalledWith({});
    jest.advanceTimersByTime(0);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
