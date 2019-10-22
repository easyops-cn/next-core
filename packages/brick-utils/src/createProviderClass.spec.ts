import { createProviderClass } from "./createProviderClass";

const spyOnDispatchEvent = jest.fn();
(global as any).HTMLElement = class {
  dispatchEvent(...args: any[]): void {
    spyOnDispatchEvent(...args);
  }
};

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
  });

  it("should update args", async () => {
    spy.mockResolvedValue("good");

    provider.updateArgs(
      new CustomEvent("any", {
        detail: {
          "[0].query": "needle"
        }
      })
    );
    expect(spy).not.toBeCalled();

    provider.updateArgsAndExecute(
      new CustomEvent("any", {
        detail: {
          "[0].page": 2
        }
      })
    );

    await (global as any).flushPromises();

    expect(spy).toBeCalledWith({
      query: "needle",
      page: 2
    });
    expect(spyOnDispatchEvent.mock.calls[0][0]).toMatchObject({
      detail: "good"
    });
  });

  it("should resolve", async () => {
    spy.mockResolvedValue(3);

    const result = await provider.resolve(1, 2);
    expect(spy).toBeCalledWith(1, 2);
    expect(result).toBe(3);
  });

  it("should reject", async () => {
    spy.mockRejectedValue("oops");

    await provider.execute();
    expect(spyOnDispatchEvent.mock.calls[0][0]).toMatchObject({
      detail: "oops"
    });
  });
});
