import { yaml } from "./yaml";

jest.spyOn(console, "error").mockImplementation(() => void 0);

describe("yaml", () => {
  const testCases: [string, unknown][] = [
    ["1", 1],
    ["age: 17", { age: 17 }],
    ["r: 3: * 8", undefined],
  ];
  test.each(testCases)("yaml(%j) should return %j", (input, output) => {
    expect(yaml(input)).toEqual(output);
  });
});
