import { yamlStringify } from "./yamlStringify";

jest.spyOn(console, "error").mockImplementation(() => void 0);

describe("yamlStringify", () => {
  const circularValue: Record<string, unknown> = {};
  circularValue.self = circularValue;

  const testCases: [unknown, number, string][] = [
    ["3", undefined, "'3'\n"],
    [{ name: "foo" }, undefined, "name: foo\n"],
    [/re/, undefined, ""],
    [circularValue, undefined, undefined],
  ];

  test.each(testCases)(
    "yamlStringify(%j, %j) should return %j",
    (value, indent, output) => {
      expect(yamlStringify(value, indent)).toEqual(output);
    }
  );
});
