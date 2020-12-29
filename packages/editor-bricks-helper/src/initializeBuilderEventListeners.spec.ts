import {
  clearBuilderEventListeners,
  initializeBuilderEventListeners,
} from "./initializeBuilderEventListeners";
import { handleBuilderDataInit } from "./internal/handleBuilderDataInit";
import { handleBuilderNodeAdd } from "./internal/handleBuilderNodeAdd";
import { handleBuilderNodeAddStored } from "./internal/handleBuilderNodeAddStored";
import { handleBuilderNodeReorder } from "./internal/handleBuilderNodeReorder";
import { handleBuilderNodeMove } from "./internal/handleBuilderNodeMove";
import { BuilderEventType } from "./interfaces";

jest.mock("./internal/handleBuilderDataInit");
jest.mock("./internal/handleBuilderNodeAdd");
jest.mock("./internal/handleBuilderNodeAddStored");
jest.mock("./internal/handleBuilderNodeReorder");
jest.mock("./internal/handleBuilderNodeMove");

const mockAddEventListener = jest.spyOn(window, "addEventListener");
const mockRemoveEventListener = jest.spyOn(window, "removeEventListener");
const mockDispatchEvent = jest.spyOn(window, "dispatchEvent");

describe("initializeBuilderEventListeners", () => {
  beforeEach(() => {
    initializeBuilderEventListeners();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle data init", () => {
    window.dispatchEvent(
      new CustomEvent(BuilderEventType.DATA_INIT, {
        detail: "data init",
      })
    );
    expect(handleBuilderDataInit).toBeCalledWith("data init");
    expect(mockDispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.DATA_UPDATE,
      })
    );
  });

  it("should handle node add", () => {
    window.dispatchEvent(
      new CustomEvent(BuilderEventType.NODE_ADD, {
        detail: "node add",
      })
    );
    expect(handleBuilderNodeAdd).toBeCalledWith("node add");
    expect(mockDispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.DATA_UPDATE,
      })
    );
  });

  it("should handle node add stored", () => {
    window.dispatchEvent(
      new CustomEvent(BuilderEventType.NODE_ADD_STORED, {
        detail: "node add stored",
      })
    );
    expect(handleBuilderNodeAddStored).toBeCalledWith("node add stored");
    expect(mockDispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.DATA_UPDATE,
      })
    );
  });

  it("should handle node reorder", () => {
    window.dispatchEvent(
      new CustomEvent(BuilderEventType.NODE_REORDER, {
        detail: "node reorder",
      })
    );
    expect(handleBuilderNodeReorder).toBeCalledWith("node reorder");
    expect(mockDispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.DATA_UPDATE,
      })
    );
  });

  it("should handle node move", () => {
    window.dispatchEvent(
      new CustomEvent(BuilderEventType.NODE_MOVE, {
        detail: "node move",
      })
    );
    expect(handleBuilderNodeMove).toBeCalledWith("node move");
    expect(mockDispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.DATA_UPDATE,
      })
    );
  });

  it("should clear event listeners", () => {
    clearBuilderEventListeners();
    expect(mockAddEventListener).toBeCalledTimes(5);
    expect(mockRemoveEventListener).toBeCalledTimes(5);
    for (const args of mockAddEventListener.mock.calls) {
      expect(mockRemoveEventListener).toBeCalledWith(...args);
    }
  });
});
