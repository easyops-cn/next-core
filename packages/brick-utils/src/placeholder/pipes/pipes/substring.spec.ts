import { substring } from "./substring";

describe("substring", () => {
  const testCases: [
    Parameters<typeof substring>,
    ReturnType<typeof substring>
  ][] = [
    [[null, 1], ""],
    [["01234", 1, 3], "12"],
  ];
  test.each(testCases)("substring(...%j) should return %j", (input, output) => {
    expect(substring(...input)).toEqual(output);
  });
});
