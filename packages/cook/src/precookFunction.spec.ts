import { describe, it, jest, expect } from "@jest/globals";
import { precookFunction } from "./precookFunction.js";

const consoleWarn = jest
  .spyOn(console, "warn")
  .mockImplementation(() => void 0);

describe("precookFunction", () => {
  it.each<[string, string, string[]]>([
    [
      "lexical variables in block statement",
      `
        function test(a) {
          {
            let b;
          }
          if (true) {
            let c;
          }
          switch (true) {
            case true:
              let d;
          }
          for (let e of x) {
            let f;
          }
          for (let g in y) {
            let h;
          }
          for (let i, j; i < 0; i += 1) {
            let j;
          }
          return test + a + b + c + d + e + f + g + h + i + j;
        }
      `,
      ["x", "y", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
    ],
    [
      "var variables in block statement of if",
      `
        function test(a) {
          if (true) {
            var c;
          }
          return b + c;
        }
      `,
      ["b"],
    ],
    [
      "var variables hoist",
      `
        function test(a) {
          const x = b + c + d + e + f + g + h + i + j + k + l;
          if (true) {
            function c(){}
          } else {
            function d(){}
          }
          switch (1) {
            case 1:
              var e;
          }
          for (var f of r) {
            var g;
          }
          for (var h in s) {
            var i;
          }
          for (var j, k; j < 0; j += 1) {
            var l;
          }
          return x;
        }
      `,
      ["b", "c", "d", "r", "s"],
    ],
    [
      "var variables hoist of destructuring",
      `
        function test(a) {
          const t = b + c + d + e + f + g + h + i + j + k + l;
          var {
            c,
            z: {
              y: d
            },
            x: [ e ]
          } = a;
          var [f, [g], { w: h }] = a;
          var { i, j } = { v: r };
          var [ k, l ] = s;
          return t;
        }
      `,
      ["b", "r", "s"],
    ],
    [
      "destructuring expressions",
      `
        function test(a) {
          const t = b + c + d + e + f + g + h;
          var {
            c,
            z: {
              y: d
            },
            x: [ e ]
          } = a;
          var [f, [g], { w: h }] = a;
          ({ i, j } = { v: r });
          [ k, l ] = s;
          return t;
        }
      `,
      ["b", "r", "i", "j", "s", "k", "l"],
    ],
    [
      "lexical variables in arrow functions",
      `
        function test(a) {
          const t = (b) => {
            let c;
            return c + d;
          };
          return t;
        }
      `,
      ["d"],
    ],
    [
      "lexical variables in arrow functions",
      `
        function test(a) {
          const t = (b) => {
            let c;
            return c + d;
          };
          return t + c;
        }
      `,
      ["d", "c"],
    ],
    [
      "var variables in arrow functions",
      `
        function test(a) {
          const t = (b) => {
            const r = c + d;
            var c;
            return r;
          };
          return t;
        }
      `,
      ["d"],
    ],
    [
      "var variables in arrow functions",
      `
        function test(a) {
          const t = (b) => {
            const r = c + d;
            var c;
            return r;
          };
          return t + c;
        }
      `,
      ["d", "c"],
    ],
    [
      "function expressions",
      `
        function test(a) {
          const t = function b() {
            return b + c;
          };
          return t;
        }
      `,
      ["c"],
    ],
    [
      "function expressions",
      `
        function test(a) {
          const t = function b() {
            return c;
          };
          return t + b;
        }
      `,
      ["c", "b"],
    ],
    [
      "function expressions with var variables",
      `
        function test(a) {
          const t = function b() {
            var d;
            return b + c;
          };
          return t + b + d;
        }
      `,
      ["c", "b", "d"],
    ],
  ])("%s", (desc, source, result) => {
    expect(Array.from(precookFunction(source).attemptToVisitGlobals)).toEqual(
      result
    );
  });

  it.each<[string, string[]]>([
    [
      `
        function test(a = test) {
          let b,
            { p: c = z } = y,
            d = (w = (x = 3));
          u = v;
          s.e.f = t;
          f();
          function f(g) { return g + r }
          ; // Empty statement
          const result = test(a+b+c+d+q+p);
          [ b = n ] = o;
          for (const h of m) {
            let k = h;
          }
          i();
          const i = function() { return l };
          return result + k + j;
        }
      `,
      [
        "z",
        "y",
        "x",
        "w",
        "v",
        "u",
        "t",
        "s",
        "r",
        "q",
        "p",
        "o",
        "n",
        "m",
        "l",
        "k",
        "j",
      ],
    ],
  ])(
    "precookFunction(%j).attemptToVisitGlobals should be %j",
    (input, cooked) => {
      expect(
        Array.from(precookFunction(input).attemptToVisitGlobals.values())
      ).toEqual(cooked);
    }
  );

  it("should warn unsupported type", () => {
    const { attemptToVisitGlobals } = precookFunction(
      "function test() { this }"
    );
    expect(Array.from(attemptToVisitGlobals.values())).toEqual([]);
    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(
      "Unsupported node type `ThisExpression`"
    );
  });

  it("should throw for invalid function declaration", () => {
    expect(() => {
      precookFunction("function test() {} test()");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expect a single function declaration at top level, but received: "FunctionDeclaration", "ExpressionStatement""`
    );
  });

  it("should throw if use reserved words of strict mode only", () => {
    expect(() => {
      precookFunction("function test() { return ((package)=>package); }");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unexpected reserved word 'package'. (1:27)"`
    );
  });
});
