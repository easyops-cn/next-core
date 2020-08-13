import { join } from "./join";

describe("join", () => {
  const testCases: [unknown[], string, string][] = [
    [[1, 2, 3], ";", "1;2;3"],
    [undefined, ";", ""],
  ];
  test.each(testCases)(
    "join(%j, %j) should return %j",
    (value, separator, output) => {
      expect(join(value, separator)).toEqual(output);
    }
  );
});
