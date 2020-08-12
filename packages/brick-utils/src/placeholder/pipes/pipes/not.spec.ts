import { not } from "./not";

describe("not", () => {
  const testCases: [unknown, boolean][] = [
    [1, false],
    [0, true],
  ];
  test.each(testCases)("not(%j) should return %j", (input, output) => {
    expect(not(input)).toEqual(output);
  });
});
