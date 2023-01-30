import { precook } from "./precook.js";
import { parseAsEstree, parseAsEstreeExpression } from "./parse.js";
import { EstreeVisitors } from "./interfaces.js";

const consoleWarn = jest
  .spyOn(console, "warn")
  .mockImplementation(() => void 0);

describe("", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each<[string, string[]]>([
    ["() => ({})", []],
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
    ["a |> b", ["a", "b"]],
    ["a |> (_ => b(_, c)) |> d", ["a", "b", "c", "d"]],
    ["new Set([1, 2, 3])", ["Set"]],
    ["tag`a${b}c${d}e`", ["tag", "b", "d"]],
    ["(b = a, a = c) => b", ["c"]],
  ])("precook(%j).attemptToVisitGlobals should be %j", (source, result) => {
    const expression = parseAsEstreeExpression(source);
    expect(Array.from(precook(expression, { expressionOnly: true }))).toEqual(
      result
    );
    expect(consoleWarn).not.toBeCalled();
  });

  it.each<[string, string, string[]]>([
    [
      "lexical variables in function",
      `
        function test(){
          let a;
          return a;
        }
      `,
      [],
    ],
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
    [
      "mix function",
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
    [
      "function parameter initializer scope",
      `
        function test(){
          function f(a = b, b = c + d + e) {
            var c;
            let d;
            function e() {}
          }
        }
      `,
      ["c", "d", "e"],
    ],
    [
      "function parameter pattern scope",
      `
        function test(){
          function f([ a = b, b = c + d + e ]) {
            var c;
            let d;
            function e() {}
          }
        }
      `,
      ["c", "d", "e"],
    ],
    [
      "try catch finally",
      `
        function test() {
          try {
            let t1;
            let t2 = t1 + vT1 + fT1 + c1 + vC1 + fC1 + f1 + vF1 + fF1;
            let t3;
            var vT1;
            var vT2;
            var vT3;
            function fT1(){}
            function fT2(){}
            function fT3(){}
          } catch (error) {
            let c1 = t2 + vT2 + fT2 + c2 + vC2 + fC2 + f2 + vF2 + fF2;
            let c2;
            let c3;
            var vC1;
            var vC2;
            var vC3;
            function fC1(){}
            function fC2(){}
            function fC3(){}
          } finally {
            let f1;
            let f2;
            let f3;
            var vF1 = t3 + vT3 + fT3 + c3 + vC3 + fC3 + f3 + vF3 + fF3;
            var vF2;
            var vF3;
            function fF1(){}
            function fF2(){}
            function fF3(){}
          }
        }
      `,
      [
        "c1",
        "fC1",
        "f1",
        "fF1",
        "t2",
        "fT2",
        "f2",
        "fF2",
        "t3",
        "fT3",
        "c3",
        "fC3",
      ],
    ],
    [
      "try body can not access catch param",
      `
        function test() {
          try {
            return error;
          } catch (error) {}
        }
      `,
      ["error"],
    ],
    [
      "catch clause can access catch param",
      `
        function test() {
          try {}
          catch (error) {
            return error;
          }
        }
      `,
      [],
    ],
    [
      "finalizer can not access catch param",
      `
        function test() {
          try {}
          catch (error) {}
          finally {
            return error;
          }
        }
      `,
      ["error"],
    ],
    [
      "while statement",
      `
        function test(){
          let x;
          while (a + b + c + d + x) {
            let a;
            var b;
            function c(){
              return y;
            }
            break;
          }
        }
      `,
      ["a", "c", "d", "y"],
    ],
    [
      "do-while statement",
      `
        function test(){
          let x;
          do {
            let a;
            var b;
            function c(){
              return y;
            }
            continue;
          } while (a + b + c + d + x);
        }
      `,
      ["y", "a", "c", "d"],
    ],
  ])("%s", (desc, source, result) => {
    const func = parseAsEstree(source);
    expect(Array.from(precook(func))).toEqual(result);
    expect(consoleWarn).not.toBeCalled();
  });

  it("should visit nodes", () => {
    const func = parseAsEstree(`
      function test(a){
        return 1;
      }
    `);
    const visitors: EstreeVisitors = {
      CallExpression: jest.fn(),
      FunctionDeclaration: jest.fn(),
      Identifier: jest.fn(),
      Literal: jest.fn(),
    };
    precook(func, {
      visitors,
    });
    expect(visitors.CallExpression).not.toBeCalled();
    expect(visitors.FunctionDeclaration).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FunctionDeclaration",
      })
    );
    expect(visitors.Identifier).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Identifier",
      })
    );
    expect(visitors.Literal).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Literal",
      })
    );
  });

  it("should call hooks", () => {
    const func = parseAsEstree(`
      function test(a){
        debugger;
        return b;
      }
    `);
    const beforeVisit = jest.fn();
    const beforeVisitGlobal = jest.fn();
    const beforeVisitUnknown = jest.fn();
    precook(func, {
      withParent: true,
      hooks: { beforeVisit, beforeVisitGlobal, beforeVisitUnknown },
    });
    expect(beforeVisit).toBeCalledTimes(5);
    expect(beforeVisit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "FunctionDeclaration",
      }),
      []
    );
    expect(beforeVisit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "Identifier",
      }),
      [
        {
          node: expect.objectContaining({
            type: "FunctionDeclaration",
          }),
          key: "params",
          index: 0,
        },
      ]
    );
    expect(beforeVisit).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: "DebuggerStatement",
      }),
      [
        {
          node: expect.objectContaining({
            type: "FunctionDeclaration",
          }),
          key: "body",
        },
        {
          node: expect.objectContaining({
            type: "BlockStatement",
          }),
          key: "body",
          index: 0,
        },
      ]
    );
    expect(beforeVisit).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: "ReturnStatement",
      }),
      [
        {
          node: expect.objectContaining({
            type: "FunctionDeclaration",
          }),
          key: "body",
        },
        {
          node: expect.objectContaining({
            type: "BlockStatement",
          }),
          key: "body",
          index: 1,
        },
      ]
    );
    expect(beforeVisit).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        type: "Identifier",
      }),
      [
        {
          node: expect.objectContaining({
            type: "FunctionDeclaration",
          }),
          key: "body",
        },
        {
          node: expect.objectContaining({
            type: "BlockStatement",
          }),
          key: "body",
          index: 1,
        },
        {
          node: expect.objectContaining({
            type: "ReturnStatement",
          }),
          key: "argument",
        },
      ]
    );
    expect(beforeVisitGlobal).toHaveBeenCalledTimes(1);
    expect(beforeVisitGlobal).toBeCalledWith(
      expect.objectContaining({
        type: "Identifier",
        name: "b",
      }),
      [
        {
          node: expect.objectContaining({
            type: "FunctionDeclaration",
          }),
          key: "body",
        },
        {
          node: expect.objectContaining({
            type: "BlockStatement",
          }),
          key: "body",
          index: 1,
        },
        {
          node: expect.objectContaining({
            type: "ReturnStatement",
          }),
          key: "argument",
        },
      ]
    );
    expect(beforeVisitUnknown).toHaveBeenCalledTimes(1);
    expect(beforeVisitUnknown).toBeCalledWith(
      expect.objectContaining({
        type: "DebuggerStatement",
      }),
      [
        {
          node: expect.objectContaining({
            type: "FunctionDeclaration",
          }),
          key: "body",
        },
        {
          node: expect.objectContaining({
            type: "BlockStatement",
          }),
          key: "body",
          index: 0,
        },
      ]
    );
  });

  it("should call hooks for arrow function expression", () => {
    const func = parseAsEstree(`
      function test(){
        return () => 0;
      }
    `);
    const beforeVisit = jest.fn();
    precook(func, {
      withParent: true,
      hooks: { beforeVisit },
    });
    expect(beforeVisit).toBeCalledTimes(4);
    expect(beforeVisit).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: "Literal",
        value: 0,
      }),
      [
        {
          node: expect.objectContaining({
            type: "FunctionDeclaration",
          }),
          key: "body",
        },
        {
          node: expect.objectContaining({
            type: "BlockStatement",
          }),
          key: "body",
          index: 0,
        },
        {
          node: expect.objectContaining({
            type: "ReturnStatement",
          }),
          key: "argument",
        },
        {
          node: expect.objectContaining({
            type: "ArrowFunctionExpression",
          }),
          key: "body",
        },
      ]
    );
  });
});
