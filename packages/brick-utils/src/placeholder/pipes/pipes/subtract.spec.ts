import { subtract } from "./subtract";

describe("subtract", () => {
  const testCases: [number, number, number][] = [[24, 1, 23]];
  test.each(testCases)(
    "subtract(%j, %j) should return %j",
    (value, operand, output) => {
      expect(subtract(value, operand)).toEqual(output);
    }
  );
});
