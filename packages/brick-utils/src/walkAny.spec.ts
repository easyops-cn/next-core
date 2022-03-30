import { walkAny } from "./walkAny";

const mockFn = jest.fn();
const newDate = new Date("2022-03-30");
const symbol = Symbol("test");

describe("walkAny", () => {
  it.each([
    [
      {
        a: 1,
        b: "2",
        c: mockFn,
        d: {
          e: {
            f: {
              g: "123",
            },
          },
          h: false,
        },
        i: [
          {
            j: "brick-1",
          },
          {
            j: "brick-2",
          },
        ],
        k: newDate,
        l: null,
        m: undefined,
        n: NaN,
        o: Infinity,
        p: -Infinity,
        q: true,
        r: false,
        s: "string",
        t: [1, 2, 3],
        u: symbol,
      },
      [
        ["a", 1],
        ["b", "2"],
        ["c", mockFn],
        ["g", "123"],
        ["f", { g: "123" }],
        ["e", { f: { g: "123" } }],
        ["h", false],
        ["d", { e: { f: { g: "123" } }, h: false }],
        ["j", "brick-1"],
        ["0", { j: "brick-1" }],
        ["j", "brick-2"],
        ["1", { j: "brick-2" }],
        ["i", [{ j: "brick-1" }, { j: "brick-2" }]],
        ["k", newDate],
        ["l", null],
        ["m", undefined],
        ["n", NaN],
        ["o", Infinity],
        ["p", -Infinity],
        ["q", true],
        ["r", false],
        ["s", "string"],
        ["0", 1],
        ["1", 2],
        ["2", 3],
        ["t", [1, 2, 3]],
        ["u", symbol],
      ],
    ],
    [
      [1, 2, 3],
      [
        ["0", 1],
        ["1", 2],
        ["2", 3],
      ],
    ],
    [1, [1]],
    ["string", ["string"]],
  ])("should work", (params, result) => {
    const collect: unknown[] = [];
    walkAny(params, (item) => {
      collect.push(item);
    });

    expect(collect).toEqual(result);
  });
});
