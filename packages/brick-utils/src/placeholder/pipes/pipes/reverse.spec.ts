import { reverse } from "./reverse";

describe("reverse", () => {
  const testCases: [unknown[], unknown[]][] = [
    [null, []],
    [
      [3, 2, 1],
      [1, 2, 3],
    ],
  ];
  test.each(testCases)("reverse(%j) should return %j", (input, output) => {
    expect(reverse(input)).toEqual(output);
  });
});
