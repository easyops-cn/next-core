import { boolean } from "./boolean";

describe("boolean", () => {
  const testCases: [unknown, boolean][] = [
    [0, false],
    [1, true],
    ["", false],
    ["0", false],
    ["1", true],
    ["null", true],
  ];
  test.each(testCases)("boolean(%j) should return %j", (input, output) => {
    expect(boolean(input)).toEqual(output);
  });
});
