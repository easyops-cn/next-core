import { LooseCase } from "./interfaces.js";

export const casesOfBindings: LooseCase[] = [
  [
    "bindings: function hoisting",
    {
      source: `
        function test() {
          function f(){ return 1 }
          return f();
          function f(){ return 2 }
        }
      `,
      args: [],
      result: 2,
    },
  ],
  [
    "bindings: var rest binding",
    {
      source: `
        function test(p) {
          var {a,b:{m,n}={},...c} = p;
          return {a,c,m,n};
        }
      `,
      args: [{ a: 1, c: 2, d: 3 }],
      result: { a: 1, c: { c: 2, d: 3 }, m: undefined, n: undefined },
    },
  ],
];
