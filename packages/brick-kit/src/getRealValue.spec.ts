import { PluginRuntimeContext } from "@next-core/brick-types";
import * as runtime from "./core/Runtime";
import { getRealValue } from "./getRealValue";

jest.mock("./history", () => ({
  getHistory() {
    return {
      location: {
        search: "?time=real",
      },
    };
  },
}));

const mockCurrentContext = jest.spyOn(runtime, "_internalApiGetCurrentContext");

describe("getRealValue", () => {
  const context: PluginRuntimeContext = {
    query: new URLSearchParams({
      quality: "good",
    }),
  };

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
