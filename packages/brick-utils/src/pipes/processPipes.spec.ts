import { processPipes } from "./processPipes";

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
    [1, "|unknown", undefined]
  ];
  it.each(cases)(
    "processPipes(%j,%j) should return %j",
    (value, rawPipes, result) => {
      expect(processPipes(value, rawPipes)).toEqual(result);
    }
  );
});
