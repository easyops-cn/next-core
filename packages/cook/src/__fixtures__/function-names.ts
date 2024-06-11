import type { LooseCase } from "./interfaces.js";

export const casesOfFunctionNames: LooseCase[] = [
  [
    "function names",
    {
      source: `
        function test() {
          let e, g, h;
          const a = function b(){};
          const c = function(){};
          const d = () => {};
          e = (function f(){});
          g = (function(){});
          h = ((() => {}));

          const [i,j] = ((f) => {
            const x = { y: f };
            let y, z;
            ({ y, _: z = (() => {}) } = x);
            return [y, z];
          })(() => {});

          const k = {
            m() {}
          };

          // KeyedBindingInitialization
          const { a: { n = () => {} } } = { a: {} };

          // IteratorDestructuringAssignmentEvaluation
          let o;
          [ [o = () => {}] ] = [[]];

          return [
            test,
            a,
            c,
            d,
            e,
            g,
            h,
            i,
            j,
            k.m,
            n,
            o,
          ].map(f => f.name);
        }
      `,
      cases: [
        {
          args: [],
          result: [
            "test",
            "b",
            "c",
            "d",
            "f",
            "g",
            "h",
            "",
            "z",
            "m",
            "n",
            "o",
          ],
        },
      ],
    },
  ],
];
