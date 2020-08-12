import { map } from "./map";

describe("map", () => {
  const testCases: [unknown, string, unknown[]][] = [
    [3, "x", []],
    [[{ key: 123 }], "key", [123]],
    [[{ key: { name: "xxx" } }, {}], "key.name", ["xxx", undefined]],
  ];
  test.each(testCases)("map(%j, %j) should return %j", (value, key, output) => {
    expect(map(value, key)).toEqual(output);
  });
});
