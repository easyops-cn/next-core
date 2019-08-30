import { isObject } from "./isObject";

describe("isObject", () => {
  const cases = [[null, false], [{}, true], [2, false], [function() {}, true]];

  it.each(cases)("isObject(%j) should return %s", (value, expected) => {
    expect(isObject(value)).toBe(expected);
  });
});
