import * as runtime from "./internal/Runtime.js";
import { getRealValue } from "./getRealValue.js";
import type { RuntimeContext } from "./internal/interfaces.js";

jest.mock("./history", () => ({
  getHistory() {
    return {
      location: {
        search: "?time=real",
      },
    };
  },
}));

const mockCurrentContext = jest.spyOn(runtime, "_internalApiGetRuntimeContext");

describe("getRealValue", () => {
  const context = {
    query: new URLSearchParams({
      quality: "good",
    }),
  } as RuntimeContext;

  beforeEach(() => {
    mockCurrentContext.mockReturnValue(context);
  });

  it.each<[unknown, unknown]>([
    ["${QUERY.quality}", "good"],
    [["<% QUERY.quality %>"], ["good"]],
    [
      {
        "<% QUERY.quality %>": "<% QUERY.quality.toUpperCase() %>",
      },
      {
        good: "GOOD",
      },
    ],
    ["oops", "oops"],
    [2, 2],
  ])("test getRealValue(%j)", (input, output) => {
    const result = getRealValue(input);
    expect(result).toEqual(output);
  });

  it("should use real time query", () => {
    expect(getRealValue("<% QUERY.time %>", { useRealTimeQuery: true })).toBe(
      "real"
    );
    expect(getRealValue("${QUERY.time}", { useRealTimeQuery: true })).toBe(
      "real"
    );
  });
});
