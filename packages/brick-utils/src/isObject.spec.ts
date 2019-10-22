import { isObject } from "./isObject";

describe("isObject", () => {
  const cases: [any, boolean][] = [
    [null, false],
    [{}, true],
    [2, false],
    [
      function() {
        // empty
      },
      true
    ]
  ];

  it.each(cases)("isObject(%j) should return %s", (value, expected) => {
    expect(isObject(value)).toBe(expected);
  });
});
