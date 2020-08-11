import { jsonStringify } from "./jsonStringify";

jest.spyOn(console, "error").mockImplementation(() => void 0);

describe("jsonStringify", () => {
  const circularValue: Record<string, unknown> = {};
  circularValue.self = circularValue;

  const testCases: [unknown, number, string][] = [
    [{ a: 1 }, undefined, '{\n  "a": 1\n}'],
    [circularValue, undefined, undefined],
  ];

  test.each(testCases)(
    "jsonStringify(%j, %j) should return %j",
    (value, indent, output) => {
      expect(jsonStringify(value, indent)).toEqual(output);
    }
  );
});
