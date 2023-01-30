import { LooseCase } from "./interfaces.js";

const casesOfExpressionAny: [string, unknown][] = [
  ["'good'", "good"],
  ["1", 1],
  ["null", null],
  ["undefined", undefined],
  ["true", true],
  ["NaN", NaN],
  ["/bc/.test('abcd')", true],
  ["/bc/.test('dcba')", false],
  ["isNaN(NaN)", true],
  ["isNaN({})", true],
  ["isNaN(1)", false],
  ["Array.isArray([])", true],
  ["Array.isArray({})", false],
  ["Object.keys(DATA.objectA)", ["onlyInA", "bothInAB"]],
  ["String([1, 2])", "1,2"],
  ["Boolean(1)", true],
  ["Boolean(0)", false],
  ["Number(true)", 1],
  ["Number.isNaN({})", false],
  ["JSON.parse('[1]')", [1]],
  ["isFinite(5)", true],
  ["isFinite(Infinity)", false],
  ["parseFloat('5.3good')", 5.3],
  ["parseInt('5.3good')", 5],
  ["Math.max(1, 2)", 2],
  ["PIPES.string(null)", ""],
  ["DATA.for", "good"],
  ["DATA['for']", "good"],
  ["DATA.other", undefined],
  ["{}", {}],
  [
    "{ quality: DATA.for, [DATA.true]: 'story' }",
    {
      quality: "good",
      true: "story",
    },
  ],
  ["[]", []],
  ["[1, DATA.number5]", [1, 5]],
  [
    // `ArrowFunctionExpression` mixed `CallExpression`
    "(a => a.b)({b: 'c'})",
    "c",
  ],
  [
    // `MemberExpression`
    "DATA.number5.toFixed(1)",
    "5.0",
  ],
  [
    // `OptionalMemberExpression`
    "DATA.number5?.toFixed(1)",
    "5.0",
  ],
  ["DATA.null || 'oops'", "oops"],
  ["DATA.for || 'oops'", "good"],
  ["DATA.null && 'oops'", null],
  ["DATA.for && 'oops'", "oops"],
  ["DATA.for ?? 'oops'", "good"],
  ["DATA.false ?? 'oops'", false],
  ["DATA.null ?? 'oops'", "oops"],
  ["DATA.undefined ?? 'oops'", "oops"],
  ["DATA.for?.length", 4],
  ["DATA?.fnReturnThisFor()", "good"],
  ["DATA.fnReturnThisFor?.()", "good"],
  ["String?.(null)", "null"],
  ["DATA.notExisted?.length", undefined],
  ["DATA.notExisted?.length?.oops", undefined],
  ["DATA.notExisted?.()", undefined],
  ["DATA.notExisted?.()?.()", undefined],
  ["DATA.notExisted?.()?.length", undefined],
  ["DATA.notExisted?.length?.()", undefined],
  ["DATA.notExisted?.length.oops", undefined],
  ["DATA.notExisted?.length()", undefined],
  ["DATA.notExisted?.()()", undefined],
  ["(DATA.notExisted)?.length", undefined],
  ["(DATA.notExisted?.length)?.oops", undefined],
  ["!DATA.null", true],
  ["+DATA.true", 1],
  ["-DATA.true", -1],
  ["typeof DATA.for", "string"],
  ["typeof DATA.unknown", "undefined"],
  ["typeof unknown", "undefined"],
  ["void DATA.for", undefined],
  ["DATA.number5 + 1", 6],
  ["DATA.number5 - 1", 4],
  ["DATA.number5 / 2", 2.5],
  ["DATA.number5 % 2", 1],
  ["DATA.number5 * 2", 10],
  ["DATA.number5 ** 2", 25],
  ["DATA.number5 == '5'", true],
  ["DATA.number5 == 4", false],
  ["DATA.number5 === 5", true],
  ["DATA.number5 === '5'", false],
  ["DATA.number5 != '5'", false],
  ["DATA.number5 != 4", true],
  ["DATA.number5 !== 5", false],
  ["DATA.number5 !== '5'", true],
  ["DATA.number5 > 4", true],
  ["DATA.number5 > 5", false],
  ["DATA.number5 < 6", true],
  ["DATA.number5 < 5", false],
  ["DATA.number5 >= 4", true],
  ["DATA.number5 >= 5", true],
  ["DATA.number5 >= 6", false],
  ["DATA.number5 <= 6", true],
  ["DATA.number5 <= 5", true],
  ["DATA.number5 <= 4", false],
  ["DATA.for ? 'yep': 'oops'", "yep"],
  ["DATA.null ? 'yep': 'oops'", "oops"],
  [
    // `SequenceExpression`
    "DATA.for, DATA.number5",
    5,
  ],
  [
    "`${null},${undefined},${true},${false},${{}},${[]},${[1,2]}${5},${NaN}`",
    `${null},${undefined},${true},${false},${{}},${[]},${[1, 2]}${5},${NaN}`,
  ],
  ["_.get(DATA, 'for')", "good"],
  ["moment().format()", "2020-03-25T17:37:00+08:00"],
  ["moment('not a real date').isValid()", false],
  [
    "moment('12-25-1995', 'MM-DD-YYYY').format(moment.HTML5_FMT.DATETIME_LOCAL)",
    "1995-12-25T00:00",
  ],
  ["[1,2,3].slice(1)", [2, 3]],
  ["[1, ...DATA.for, 2]", [1, "g", "o", "o", "d", 2]],
  // eslint-disable-next-line no-sparse-arrays
  ["[1, , 2]", [1, , 2]],
  ["[-1].concat(0, ...[1, 2], 3)", [-1, 0, 1, 2, 3]],
  ["[-1]?.concat(0, ...[1, 2], 3)", [-1, 0, 1, 2, 3]],
  [
    "{...DATA.objectA, ...DATA.objectB, ...DATA.objectC, ...DATA.objectD}",
    {
      onlyInA: 1,
      bothInAB: 4,
      onlyInB: 3,
      C2: 12,
      [Symbol.for("test-symbol")]: "Hello Symbol",
    },
  ],
  ["DATA.objectD[DATA.symbol]", "Hello Symbol"],
  ["{...null, ...undefined}", {}],
  ["[1, undefined, null].map((i = 5) => i)", [1, 5, null]],
  ["[1, undefined].map((i = DATA.number5) => i)", [1, 5]],
  [
    // `j` is not defined, but not evaluated either.
    "[1, 2].map((i = j + 1) => i)",
    [1, 2],
  ],
  [
    // `j` is not initialized, but not evaluated either.
    "[1, 2].map((i = j + 1, j) => i)",
    [1, 2],
  ],
  ["[1, 2].map(i => ((i, j = i + 1) => i + j)(i))", [3, 5]],
  [
    "[1, 2].map((...args) => args)",
    [
      [1, 0, [1, 2]],
      [2, 1, [1, 2]],
    ],
  ],
  [
    "[1, 2].map((i, ...args) => args)",
    [
      [0, [1, 2]],
      [1, [1, 2]],
    ],
  ],
  // `ArrayPattern`
  ["[[1, 2]].map(([a, b]) => a + b)", [3]],
  // `ArrayPattern` with `RestElement`
  ["[[1, 2, 3]].map(([a, ...b]) => a + b.length)", [3]],
  // Nested `ArrayPattern`
  ["[[1, [2, 3]]].map(([a, [b, c]]) => a + b + c)", [6]],
  // `ArrayPattern` with `AssignmentPattern`
  ["[[1]].map(([a, [b, c] = [2, 3]]) => a + b + c)", [6]],
  // `ArrayPattern` with Nested `AssignmentPattern`
  ["[[1]].map(([a, [b, c = 3] = [2]]) => a + b + c)", [6]],
  // `ArrayPattern` with parameter scope
  ["[[1]].map(([a, [b, c = b] = [2]]) => a + b + c)", [5]],
  // `ObjectPattern`
  ["[{a: 1, b: 2}].map(({a, b}) => a + b)", [3]],
  // `ObjectPattern` with `RestElement`
  ["[{a: 1, b: 2, c: 3}].map(({a, ...b}) => a + b.b + b.c)", [6]],
  // Nested `ObjectPattern`
  ["[{a: 1, b: { d: 2 }}].map(({a, b: { d: c }}) => a + c)", [3]],
  // `ObjectPattern` with `AssignmentPattern` and `RestElement`
  ["[undefined].map(({a, ...b}={}) => a + b)", ["undefined[object Object]"]],
  // `ObjectPattern` with a computed key
  ["[{'a.b': 1}].map(({'a.b': c}) => c)", [1]],
  // Reuse arrow functions.
  ["(fn => fn(2)+fn())((a=1)=>a)", 3],
  // Nested arrow functions
  ["((a)=>(b)=>a+b)(1)(2)", 3],
  ["new Set([1, 2, 3])", new Set([1, 2, 3])],
  ["new Array(1, ...[2, 3])", [1, 2, 3]],
  [
    "String(new URLSearchParams({q: 'hello,world', age: 18}))",
    "q=hello%2Cworld&age=18",
  ],
  // Tagged template.
  ["((s,...k) => `${s.join('-')}:${k.join(',')}`)`a${1}b${2}c`", "a-b-c:1,2"],
  [
    "TAG_URL`${APP.homepage}/list?q=${DATA.q}&redirect=${DATA.redirect}`",
    "/hello/world/list?q=a%26b&redirect=/r/s%3Ft%3Du%26v%3Dw",
  ],
  ["SAFE_TAG_URL`file/${DATA.path}?q=${DATA.q}`", "file/x%2Fy.zip?q=a%26b"],
  [
    // Reuse tagged template.
    "(f=>f()+','+f())(() => TAG_URL`${DATA.q}`)",
    "a%26b,a%26b",
  ],
  ["btoa('hello')", "aGVsbG8="],
  ["atob('aGVsbG8=')", "hello"],
];

export const casesOfExpressionOnly: [string, unknown][] = [
  ...casesOfExpressionAny,
  // Pipeline operator.
  ["DATA.number5 |> PIPES.string", "5"],
  ["DATA.number5 |> String", "5"],
  // Sequential pipeline operators with an arrow function.
  ["DATA.number5 |> (_ => _ + 1) |> PIPES.string", "6"],
  ["((package)=>package)(1)", 1],
];

export const casesOfExpressions: LooseCase[] = casesOfExpressionAny.map(
  ([source, result]) => [
    `expression: ${source}`,
    {
      source: `
      function test() {
        return (${source});
      }
    `,
      args: [],
      result,
    },
  ]
);
