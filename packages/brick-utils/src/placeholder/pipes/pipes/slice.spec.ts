import { slice } from "./slice";

describe("slice", () => {
  const testCases: [Parameters<typeof slice>, ReturnType<typeof slice>][] = [
    [
      [[1, 2, 3, 4, 5], 1, 3],
      [2, 3],
    ],
    [
      [[1, 2, 3, 4, 5], 1],
      [2, 3, 4, 5],
    ],
  ];
  test.each(testCases)("slice(...%j) should return %j", (input, output) => {
    expect(slice(...input)).toEqual(output);
  });
});
