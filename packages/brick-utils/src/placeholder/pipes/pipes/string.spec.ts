import { string } from "./string";

describe("string", () => {
  const testCases: [unknown, string][] = [
    [1, "1"],
    [undefined, ""],
    [null, ""],
  ];
  test.each(testCases)("string(%j) should return %j", (input, output) => {
    expect(string(input)).toEqual(output);
  });
});
