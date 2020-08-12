import { groupByToIndex } from "./groupByToIndex";

describe("groupByToIndex", () => {
  const testCases: [
    Record<string, unknown>[],
    string,
    string,
    Record<string, unknown>[]
  ][] = [
    [
      [
        { a: "3", b: "1" },
        { a: "1", b: "2" },
        { a: "1", b: "3" },
      ],
      "a",
      "groupIndex",
      [
        { a: "3", b: "1", groupIndex: 1 },
        { a: "1", b: "2", groupIndex: 0 },
        { a: "1", b: "3", groupIndex: 0 },
      ],
    ],
    [
      [{ a: "3" }, { a: "1" }],
      undefined,
      "groupIndex",
      [{ a: "3" }, { a: "1" }],
    ],
    [[{ a: "3" }, { a: "1" }], "a", undefined, [{ a: "3" }, { a: "1" }]],
  ];
  test.each(testCases)(
    "groupByToIndex(%j, %j, %j) should return %j",
    (value, groupField, targetField, output) => {
      expect(groupByToIndex(value, groupField, targetField)).toEqual(output);
    }
  );
});
