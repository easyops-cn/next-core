import { divide } from "./divide";

describe("divide", () => {
  const testCases: [number, number, number][] = [
    [24, 0, Infinity],
    [24, 3, 8],
  ];
  test.each(testCases)(
    "divide(%j, %j) should return %j",
    (value, operand, output) => {
      expect(divide(value, operand)).toEqual(output);
    }
  );
});
