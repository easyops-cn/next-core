import type { getHistory as _getHistory } from "./history.js";

describe("history", () => {
  let getHistory: typeof _getHistory;

  test("missing v2 runtime", () => {
    jest.isolateModules(() => {
      ({ getHistory } = require("./history.js"));
    });

    expect(getHistory()).toBe(undefined);
  });

  test("fallback to v2 history", () => {
    (global as any).dll = (id: string) => {
      if (id === "tYg3") {
        return {
          getHistory() {
            return { location: { pathname: "/hello" } };
          },
        };
      }
    };
    (global as any).BRICK_NEXT_VERSIONS = {
      "brick-container": "2.3.4",
    };

    jest.isolateModules(() => {
      ({ getHistory } = require("./history.js"));
    });

    expect(getHistory().location.pathname).toBe("/hello");
    delete (global as any).dll;
    delete (global as any).BRICK_NEXT_VERSIONS;
  });
});
