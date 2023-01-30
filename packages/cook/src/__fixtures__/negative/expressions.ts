import { LooseCase } from "../interfaces.js";

const negativeCasesOfExpressionAny: string[] = [
  // `_.reverse` is not supplied.
  "_.reverse([0,1,2])",
  "Object.assign(DATA, { override: true })",
  // When `EVENT` is not supplied.
  "EVENT.detail",
  "DATA.number5()",
  "DATA?.()",
  "DATA?.number5()",
  "DATA?.number5.notExisted.oops",
  "DATA.number5?.toFixed.oo.ps",
  "DATA.number5.toFixed?.().oops()",
  "(DATA.notExisted?.length).oops",
  "[...DATA]",
  "[...null]",
  "[...undefined]",
  // `j` is not defined, and will be evaluated.
  "[undefined].map((i = j + 1) => i)",
  // `j` is not initialized, and will be evaluated.
  "[undefined].map((i = j + 1, j) => i)",
  // Parameters affect the scopes.
  "[undefined].map((i = DATA.number5, DATA) => i)",
  // `ObjectPattern` meet nil
  "[undefined].map(({}) => 1)",
  "[undefined].map(({a}) => a)",
  "[undefined].map(({...a}) => a)",
  "moment.updateLocale('en', {})",
  // `ArrayPattern` meets non-iterable.
  "[[1]].map(([a, [b]]) => a + b)",
  "[1, 2].map(([, a]) => a)",
  "/bc\\u{/u.test('dcba')",
  "(Set => new Set())(() => null)",
  "1`a${1}b`",
  "c`a${1}b`",
  // Reuse arrow functions.
  "(fn => fn(2,1)+fn())((a=b,b)=>a)",
  "typeof unknown.any",
  // Todo(steve)
  // "_.wrap(_.method('constructor.assign',{a:1},{b:2}),(func,...a) => func(...a))({})"
];

export const negativeCasesOfExpressionOnly = [
  "DATA |> DATA.number5",
  ...negativeCasesOfExpressionAny,
];

const selectiveNegativeCasesOfAny: string[] = [
  "DATA.number5 ^ 1",
  "async () => null",
  "/bc\\u{13}/u.test('dcba')",
  "({}).constructor.assign",
  "((a,b)=>a[b])(()=>1, 'constructor')",
  "((a,b)=>a[b])(()=>1, 'constructor')('console.log(`yo`)')()",
  "((a,b)=>a[b])(()=>1, 'constructor').bind(null)('console.log(`yo`)')()",
  "_.get(()=>1, 'constructor.prototype')",
  "new Boolean()",
  "(Set => new Set())(function(){})",
  "{__proto__:{}}",
];

export const selectiveNegativeCasesOfExpressionOnly: string[] = [
  "() => {}",
  "delete DATA.for",
  "this.bad",
  ...selectiveNegativeCasesOfAny,
];

export const negativeCasesOfExpression: LooseCase[] =
  negativeCasesOfExpressionAny
    .concat("delete DATA.objectC.C1", "this.bad")
    .map((source) => [
      `expression: ${source}`,
      {
        source: `
      function test() {
        return (${source});
      }
    `,
        args: [],
      },
    ]);

export const selectiveNegativeCasesOfExpression: LooseCase[] =
  selectiveNegativeCasesOfAny
    .concat("{ get prop() { return 1; } }")
    .map((source) => [
      `expression: ${source}`,
      {
        source: `
      function test() {
        return (${source});
      }
    `,
        args: [],
      },
    ]);
