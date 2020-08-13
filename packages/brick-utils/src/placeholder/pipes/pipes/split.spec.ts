import { split } from "./split";

describe("split", () => {
  const testCases: [string, string, string[]][] = [
    ["hello, world", ", ", ["hello", "world"]],
    [null, ", ", []],
  ];
  test.each(testCases)(
    "split(%j, %j) should return %j",
    (value, separator, output) => {
      expect(split(value, separator)).toEqual(output);
    }
  );
});
