import { createProviderClass } from "./createProviderClass";
import { saveAs } from "file-saver";

jest.mock("file-saver");
const mockSaveAs = saveAs as jest.Mock;

const spyOnDispatchEvent = jest.fn();
(global as any).HTMLElement = class {
  dispatchEvent(...args: any[]): void {
    spyOnDispatchEvent(...args);
  }
};
const consoleWarn = jest.spyOn(console, "warn");

describe("createProviderClass", () => {
  const spy = jest.fn();
  const Provider = createProviderClass(spy);
  let provider: any;

  beforeEach(() => {
    provider = new Provider();
  });

  afterEach(() => {
    spy.mockReset();
    spyOnDispatchEvent.mockClear();
    consoleWarn.mockClear();
  });

  it("should be a provider", () => {
    expect(provider.$$typeof).toBe("provider");
  });

  it("should update args", async () => {
    spy.mockResolvedValue("good");

    provider.updateArgs(
      new CustomEvent("any", {
        detail: {
          "[0].query": "needle",
        },
      })
    );
    expect(spy).not.toBeCalled();

    provider.updateArgsAndExecute(
      new CustomEvent("any", {
        detail: {
          "[0].page": 2,
        },
      })
    );

    await (global as any).flushPromises();

    expect(spy).toBeCalledWith({
      query: "needle",
      page: 2,
    });
    expect(spyOnDispatchEvent.mock.calls[0][0].type).toBe("response.success");
    expect(spyOnDispatchEvent.mock.calls[0][0].detail).toBe("good");
    expect(consoleWarn).not.toBeCalled();
  });

  it("should warn if use updateArgs with non-custom-event", () => {
    provider.updateArgs({
      detail: {
        "[0].query": "needle",
      },
    });
    expect(consoleWarn).toBeCalled();
  });

  it("should warn if use updateArgsAndExecute with non-custom-event", () => {
    provider.updateArgsAndExecute({
      detail: {
        "[0].query": "needle",
      },
    });
    expect(consoleWarn).toBeCalled();
  });

  it("should set args", async () => {
    spy.mockResolvedValue("good");

    provider.setArgs({
      "[0].query": "needle",
    });
    expect(spy).not.toBeCalled();

    provider.setArgsAndExecute({
      "[0].page": 2,
    });

    await (global as any).flushPromises();

    expect(spy).toBeCalledWith({
      query: "needle",
      page: 2,
    });
    expect(spyOnDispatchEvent.mock.calls[0][0].type).toBe("response.success");
    expect(spyOnDispatchEvent.mock.calls[0][0].detail).toBe("good");
    expect(consoleWarn).not.toBeCalled();
  });

  it("should execute with args", async () => {
    spy.mockResolvedValue(3);

    const result = await provider.executeWithArgs(1, 2);
    expect(spy).toBeCalledWith(1, 2);

    expect(result).toBe(3);
    expect(spyOnDispatchEvent.mock.calls[0][0].type).toBe("response.success");
    expect(spyOnDispatchEvent.mock.calls[0][0].detail).toBe(3);
    expect(consoleWarn).not.toBeCalled();
  });

  it("should resolve", async () => {
    spy.mockResolvedValue(3);

    const result = await provider.resolve(1, 2);
    expect(spy).toBeCalledWith(1, 2);
    expect(result).toBe(3);
  });

  it("should reject", async () => {
    spy.mockRejectedValue("oops");
    expect.assertions(3);

    try {
      await provider.execute();
    } catch (error) {
      expect(error).toBe("oops");
    }

    expect(spyOnDispatchEvent.mock.calls[0][0].type).toBe("response.error");
    expect(spyOnDispatchEvent.mock.calls[0][0].detail).toBe("oops");
  });

  it("should download", async () => {
    await provider.saveAs("x.zip");
    expect(mockSaveAs.mock.calls[0][1]).toBe("x.zip");
  });
});
