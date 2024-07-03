import type { LooseCase } from "./interfaces.js";

export const casesOfFunctions: LooseCase[] = [
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
  [
    "function length",
    {
      source: `
        function test() {
          function a() {}
          function b(c, d = 1, ...e) {}
          function f(g, {h}, [i], {j} = {}, k) {}
          function l([m] = [], _) {}
          function n(o, ...p) {}
          return [a.length, b.length, f.length, l.length, n.length];
        }
      `,
      cases: [
        {
          args: [],
          result: [0, 1, 3, 0, 1],
        },
      ],
    },
  ],
  [
    "[ExternalSourceForDebug] access this with constructor",
    {
      source: `
        function test() {
          function A() {
            this.b = 1;
          }
          const a = new A();
          return a.b;
        }
      `,
      cases: [
        {
          args: [],
          result: 1,
        },
      ],
    },
  ],
  [
    "[ExternalSourceForDebug] access arguments in arrow function",
    {
      source: `
        function test() {
          const a = () => {
            return arguments[0];
          };
          return a(1);
        }
      `,
      cases: [
        {
          args: [2, 3],
          result: 2,
        },
      ],
    },
  ],
  [
    "[ExternalSourceForDebug] access this with member expression",
    {
      source: `
        function test() {
          const a = {
            b: 1,
            getB() {
              return this.b;
            }
          };
          return a.getB();
        }
      `,
      cases: [
        {
          args: [],
          result: 1,
        },
      ],
    },
  ],
  [
    "[ExternalSourceForDebug] access this within arrow function",
    {
      source: `
        function test() {
          function A() {
            this.b = 1;
            this.getB = () => {
              return this.b;
            }
          }
          const a = new A();
          return a.getB();
        }
      `,
      cases: [
        {
          args: [],
          result: 1,
        },
      ],
    },
  ],
];
