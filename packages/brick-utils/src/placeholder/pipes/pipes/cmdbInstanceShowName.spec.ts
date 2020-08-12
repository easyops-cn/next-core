import { cmdbInstanceShowName } from "./cmdbInstanceShowName";

describe("cmdbInstanceShowName", () => {
  const testCases: [unknown, unknown][] = [
    [["a"], "a"],
    [["a", "b"], "a(b)"],
    [["a", "b", "c"], "a(b,c)"],
    [[], ""],
    ["asd", "asd"],
    [123, 123],
    [undefined, undefined],
  ];
  test.each(testCases)(
    "cmdbInstanceShowName(%j) should return %j",
    (input, output) => {
      expect(cmdbInstanceShowName(input)).toEqual(output);
    }
  );
});
