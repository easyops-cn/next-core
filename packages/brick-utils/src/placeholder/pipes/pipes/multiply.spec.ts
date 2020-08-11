import { multiply } from "./multiply";

describe("multiply", () => {
  const testCases: [number, number, number][] = [[24, 1.5, 36]];
  test.each(testCases)(
    "multiply(%j, %j) should return %j",
    (value, operand, output) => {
      expect(multiply(value, operand)).toEqual(output);
    }
  );
});
