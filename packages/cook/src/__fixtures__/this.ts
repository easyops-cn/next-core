import type { LooseCase } from "./interfaces.js";

export const casesOfThis: LooseCase[] = [
  [
    "access this with constructor",
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
    "access this with member expression",
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
    "access this within arrow function",
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
