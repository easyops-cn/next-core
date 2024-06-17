import { describe, test, expect } from "@jest/globals";
import {
  setMatchedRoute,
  getMatchedRoute,
  clearMatchedRoutes,
} from "./routeMatchedMap.js";

describe("routeMatchedMap", () => {
  test("should work", () => {
    const matched = {
      path: "/cmdb/Host",
      url: "/cmdb/Host",
      isExact: true,
      params: { instanceId: "abc" },
    };
    setMatchedRoute("618a1a855fa89", matched);

    expect(getMatchedRoute("618a1a855fa89")).toEqual(matched);
    clearMatchedRoutes();

    expect(getMatchedRoute("618a1a855fa89")).toEqual(undefined);
  });
});
