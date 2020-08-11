import { number } from "./number";

describe("number", () => {
  const testCases: [unknown, number][] = [
    ["1", 1],
    ["1.2", 1.2],
    [1.3, 1.3],
  ];
  test.each(testCases)("number(%j) should return %j", (input, output) => {
    expect(number(input)).toEqual(output);
  });
});
