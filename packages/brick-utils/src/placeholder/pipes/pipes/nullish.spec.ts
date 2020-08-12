import { nullish } from "./nullish";

describe("nullish", () => {
  const testCases: [unknown, unknown, unknown][] = [
    [null, "-", "-"],
    [undefined, "-", "-"],
    ["", "-", ""],
    ["test", "-", "test"],
  ];
  test.each(testCases)(
    "nullish(%j, %j) should return %j",
    (value, defaultValue, output) => {
      expect(nullish(value, defaultValue)).toEqual(output);
    }
  );
});
