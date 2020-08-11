import { substr } from "./substr";

describe("substr", () => {
  const testCases: [Parameters<typeof substr>, ReturnType<typeof substr>][] = [
    [[null, 1], ""],
    [["01234", 1, 3], "123"],
  ];
  test.each(testCases)("substr(...%j) should return %j", (input, output) => {
    expect(substr(...input)).toEqual(output);
  });
});
