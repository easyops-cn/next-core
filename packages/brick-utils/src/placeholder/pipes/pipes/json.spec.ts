import { json } from "./json";

jest.spyOn(console, "error").mockImplementation(() => void 0);

describe("json", () => {
  const testCases: [string, unknown][] = [
    ['{"a":1}', { a: 1 }],
    ["{", undefined],
    [undefined, undefined],
    [null, null],
  ];
  test.each(testCases)("json(%j) should return %j", (input, output) => {
    expect(json(input)).toEqual(output);
  });
});
