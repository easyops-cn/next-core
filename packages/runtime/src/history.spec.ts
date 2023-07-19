import { getHistory } from "./history.js";

describe("history", () => {
  test("missing v2 runtime", () => {
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
    expect(getHistory().location.pathname).toBe("/hello");
    delete (global as any).dll;
  });
});
