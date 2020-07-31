import { precook } from "./precook";

const consoleWarn = jest
  .spyOn(console, "warn")
  .mockImplementation(() => void 0);

describe("precook", () => {
  it.each<[string, string[]]>([
    ["() => {}", []],
    ["[, DATA]", ["DATA"]],
    ["'good'", []],
    ["1", []],
    ["null", []],
    ["true", []],
    ["undefined", ["undefined"]],
    ["NaN", ["NaN"]],
    ["isNaN(NaN)", ["isNaN", "NaN"]],
    ["Array.isArray(NaN)", ["Array", "NaN"]],
    ["DATA.for", ["DATA"]],
    ["DATA['for']", ["DATA"]],
    ["{}", []],
    ["{ quality: DATA.for, [EVENT.detail]: 'story' }", ["DATA", "EVENT"]],
    ["{DATA}", ["DATA"]],
    ["{DATA: EVENT.detail}", ["EVENT"]],
    ["{'DATA': EVENT.detail}", ["EVENT"]],
    ["{[DATA.for]: EVENT.detail}", ["DATA", "EVENT"]],
    ["{[{DATA}]: EVENT.detail}", ["DATA", "EVENT"]],
    ["{[{DATA: 1}]: EVENT.detail}", ["EVENT"]],
    ["{QUERY: {DATA: EVENT.detail} }", ["EVENT"]],
    ["{QUERY: {[DATA]: EVENT.detail} }", ["DATA", "EVENT"]],
    ["{[QUERY]: {[DATA]: EVENT.detail} }", ["QUERY", "DATA", "EVENT"]],
    ["{[QUERY]: {DATA: EVENT.detail} }", ["QUERY", "EVENT"]],
    ["[]", []],
    ["[1, DATA.null]", ["DATA"]],
    ["(a => a.b)({b: 'c'})", []],
    ["DATA.null?.toFixed(1)", ["DATA"]],
    ["DATA.null?.toFixed(EVENT.detail)", ["DATA", "EVENT"]],
    ["DATA.null || EVENT.detail", ["DATA", "EVENT"]],
    ["DATA.null ?? EVENT.detail", ["DATA", "EVENT"]],
    ["!DATA.null", ["DATA"]],
    ["DATA.number5 + EVENT.detail", ["DATA", "EVENT"]],
    ["DATA.number5 ? EVENT.detail : APP.homepage", ["DATA", "EVENT", "APP"]],
    ["DATA.number5, EVENT.detail", ["DATA", "EVENT"]],
    ["`${null},${DATA}`", ["DATA"]],
    ["[1, ...DATA]", ["DATA"]],
    ["compact(1, ...DATA)", ["compact", "DATA"]],
    ["{a: 1, ...DATA.objectA, ...EVENT.objectB}", ["DATA", "EVENT"]],
    ["(i = DATA.number5, j, ...k) => i + EVENT.detail", ["DATA", "EVENT"]],
    ["([a, b]) => a + b", []],
    ["([a, ...b]) => a + b", []],
    ["([a, b = c]) => a + b + c", ["c"]],
    ["({a, b}) => a + b", []],
    ["({a, ...b}) => a + b", []],
    ["({a, b: c}) => a + b + c", ["b"]],
    ["({a, b: c = d}) => a + b + c", ["d", "b"]],
  ])("precook(%j).attemptToVisitGlobals should be %j", (input, cooked) => {
    expect(Array.from(precook(input).attemptToVisitGlobals.values())).toEqual(
      cooked
    );
  });

  it("should warn unsupported type", () => {
    expect(
      Array.from(precook("this.bad").attemptToVisitGlobals.values())
    ).toEqual([]);
    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(
      "Unsupported node type `ThisExpression`: `this`"
    );
  });
});
