import { getAllContextValues } from "../secret_internals.js";
import {
  addRealTimeDataInspectHook,
  setRealTimeDataInspectRoot,
} from "./realTimeDataInspect.js";

jest.mock("../secret_internals.js");

jest.useFakeTimers();

const consoleError = jest.spyOn(console, "error").mockImplementation();

describe("realTimeDataInspect", () => {
  test("hook", () => {
    const hook = jest.fn();
    addRealTimeDataInspectHook(hook);
    setRealTimeDataInspectRoot({});
    expect(getAllContextValues).toHaveBeenCalledWith({});
    jest.advanceTimersByTime(0);
    expect(hook).toHaveBeenCalledWith({
      changeType: "initialize",
      tplStateStoreId: undefined,
      detail: { data: undefined },
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("hook throws", () => {
    const hook = jest.fn(() => {
      throw new Error("oops");
    });
    addRealTimeDataInspectHook(hook);
    setRealTimeDataInspectRoot({});
    expect(getAllContextValues).toHaveBeenCalledWith({});
    jest.advanceTimersByTime(0);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
