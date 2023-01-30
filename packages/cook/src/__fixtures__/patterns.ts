import { LooseCase } from "./interfaces.js";

export const casesOfPatterns: LooseCase[] = [
  [
    "assignment patterns",
    {
      source: `
        function test(...params) {
          let a, b, c;
          [a,{b,...c},{}] = params;
          return [a,...b,c];
        }
      `,
      args: [1, { b: [2, 3], c: 4, d: 5 }, { e: 6 }],
      result: [1, 2, 3, { c: 4, d: 5 }],
    },
  ],
  [
    "assignment patterns: computed properties",
    {
      source: `
        function test(...params) {
          let a, b, c, d, e, k = 'z';
          [{ 'j': a=0, [k]: b, ['l']: c, m: { n: { o: d, ...e } = {} } = {} }={}] = params;
          return {a,b,...c, d,e};
        }
      `,
      cases: [
        {
          args: [
            {
              j: 1,
              k: 2,
              l: { x: 3, y: 4 },
              m: { n: { o: 6, p: 7, q: 8 } },
              z: 9,
            },
          ],
          result: { a: 1, b: 9, x: 3, y: 4, d: 6, e: { p: 7, q: 8 } },
        },
        {
          args: [],
          result: { a: 0, b: undefined, d: undefined, e: {} },
        },
      ],
    },
  ],
  [
    "assignment patterns: member expressions",
    {
      source: `
        function test(...params) {
          let a = {};
          [a.x,{b:a.b=0,c:a.c,...a.d},...a.f] = params;
          return a;
        }
      `,
      cases: [
        {
          args: [1, { b: [2, 3], c: 4, d: 5, e: 6 }, 7, 8],
          result: { x: 1, b: [2, 3], c: 4, d: { d: 5, e: 6 }, f: [7, 8] },
        },

        {
          args: [1, {}],
          result: { x: 1, b: 0, c: undefined, d: {}, f: [] },
        },
      ],
    },
  ],
  [
    "binding patterns",
    {
      source: `
        function test(...params) {
          let [a=0,,b=9,...c] = params;
          return [a,b,c];
        }
      `,
      args: [1, 2, 3, 4, 5],
      result: [1, 3, [4, 5]],
    },
  ],
  [
    "binding patterns: var binding",
    {
      source: `
      function test(...params) {
        var [a=0,,b=9,...c] = params;
        return [a,b,c];
      }
      `,
      args: [1, 2, 3, 4, 5],
      result: [1, 3, [4, 5]],
    },
  ],
  [
    "binding patterns: rest patterns",
    {
      source: `
        function test(...params) {
          let [a,...{length:b}] = params;
          return [a,b];
        }
      `,
      args: [1, 2, 3, 4, 5],
      result: [1, 4],
    },
  ],
];
