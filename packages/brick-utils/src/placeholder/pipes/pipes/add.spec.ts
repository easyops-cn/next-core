import { add } from "./add";

describe("add", () => {
  const testCases: [number | string, number | string, number | string][] = [
    [1, 2, 3],
    ["a", "b", "ab"],
    ["a", 1, "a1"],
  ];
  test.each(testCases)(
    "add(%j, %j) should return %j",
    (value, operand, output) => {
      expect(add(value, operand)).toEqual(output);
    }
  );
});
