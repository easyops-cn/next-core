/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock("@next-core/runtime");

const consoleError = jest.spyOn(console, "error");

describe("initialize", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("initialize twice", async () => {
    const initialize = require("./initialize.js").default;
    const ok = await initialize(Promise.resolve("ok"), "http://localhost:8080");
    expect(ok).toBe(true);
    const ok2 = await initialize(
      Promise.resolve("ok"),
      "http://localhost:8080"
    );
    expect(ok2).toBe(false);
  });

  test("bootstrap failed", async () => {
    const initialize = require("./initialize.js").default;
    const ok = await initialize(
      Promise.resolve("failed"),
      "http://localhost:8080"
    );
    expect(ok).toBe(false);
  });

  test("allowed origin", async () => {
    const { getRuntime } = require("@next-core/runtime");
    const mockGetRuntime = getRuntime as jest.MockedFunction<typeof getRuntime>;
    mockGetRuntime.mockReturnValueOnce({
      getMiscSettings() {
        return { allowedPreviewFromOrigins: ["https://dev.easyops.local"] };
      },
    } as any);

    const location = window.location;
    delete (window as any).location;
    window.location = {
      origin: "https://sit.easyops.local",
    } as any;

    const initialize = require("./initialize.js").default;
    const ok = await initialize(
      Promise.resolve("ok"),
      "https://dev.easyops.local"
    );
    expect(ok).toBe(true);

    (window as any).location = location;
  });

  test("no settings", async () => {
    const { getRuntime } = require("@next-core/runtime");
    const mockGetRuntime = getRuntime as jest.MockedFunction<typeof getRuntime>;
    mockGetRuntime.mockReturnValueOnce({
      getMiscSettings() {
        return {};
      },
    } as any);

    consoleError.mockReturnValueOnce();
    const location = window.location;
    delete (window as any).location;
    window.location = {
      origin: "https://sit.easyops.local",
    } as any;

    const initialize = require("./initialize.js").default;
    const ok = await initialize(
      Promise.resolve("ok"),
      "https://dev.easyops.local"
    );
    expect(ok).toBe(false);
    expect(consoleError).toBeCalledWith(expect.stringContaining("disallowed"));

    (window as any).location = location;
  });
});
