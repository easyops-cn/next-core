import { processPipes } from "./processPipes";
import { PipeCall } from "../interfaces";

describe("processPipes", () => {
  const circularValue: any = {};
  circularValue.self = circularValue;
  const cases: [any, string, any][] = [
    [1, "", 1],
    [1, "|string", "1"],
    [undefined, "|string", ""],
    [null, "|string", ""],
    ["1", "|number", 1],
    [1, "|bool", true],
    [0, "|bool", false],
    ["0", "|bool", false],
    ['{"a":1}', "|json", { a: 1 }],
    ["{", "|json", undefined],
    [{ a: 1 }, "|jsonStringify", '{\n  "a": 1\n}'],
    [circularValue, "|jsonStringify", undefined],
    [1, "|unknown", undefined],
    [1, "|bool|not", false],
    [0, "|bool|not", true]
  ];
  it.each(cases)(
    "process %j with pipes %j should return %j",
    (value, rawPipes, result) => {
      expect(
        processPipes(
          value,
          // Compile the pipes first, in a hacking way.
          rawPipes
            ? rawPipes
                .substr(1)
                .split("|")
                .map<PipeCall>(id => ({
                  type: "PipeCall",
                  identifier: id,
                  parameters: []
                }))
            : []
        )
      ).toEqual(result);
    }
  );
  it.each([
    [[{ key: 123 }], "key", [123]],
    [[{ key: { name: "xxx" } }, {}], "key.name", ["xxx", undefined]]
  ])("map should work", (value, param, res) => {
    expect(
      processPipes(value, [
        { type: "PipeCall", identifier: "map", parameters: [param] }
      ])
    ).toEqual(res);
  });

  it.each([
    [
      [
        { a: "3", b: "1" },
        { a: "1", b: "2" },
        { a: "1", b: "3" }
      ],
      "a",
      "groupIndex",
      [
        { a: "3", b: "1", groupIndex: 1 },
        { a: "1", b: "2", groupIndex: 0 },
        { a: "1", b: "3", groupIndex: 0 }
      ]
    ],
    [
      [{ a: "3" }, { a: "1" }],
      undefined,
      "groupIndex",
      [{ a: "3" }, { a: "1" }]
    ],
    [[{ a: "3" }, { a: "1" }], "a", undefined, [{ a: "3" }, { a: "1" }]]
  ])("groupByToIndex should work", (value, groupField, targetField, res) => {
    expect(
      processPipes(value, [
        {
          type: "PipeCall",
          identifier: "groupByToIndex",
          parameters: [groupField, targetField]
        }
      ])
    ).toEqual(res);
  });
});
