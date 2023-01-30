import { LooseCase } from "../interfaces.js";

export const casesOfForInLoops: LooseCase[] = [
  [
    "for in loop",
    {
      source: `
        function test(a){
          for (const k in a) {
            return k;
          }
          return 'not found';
        }
      `,
      cases: [
        {
          args: [{ v: 1 }],
          result: "v",
        },
        {
          args: [null],
          result: "not found",
        },
      ],
    },
  ],
  [
    "for in loop: assignment destructuring",
    {
      source: `
        function test(a){
          var length;
          for ({ length } in a) {}
          return length;
        }
      `,
      args: [{ value: 1 }],
      result: 5,
    },
  ],
  [
    "for in loop: var binding destructuring",
    {
      source: `
        function test(a){
          for (var { length } in a) {}
          return length;
        }
      `,
      args: [{ value: 1 }],
      result: 5,
    },
  ],
  [
    "for in loop: lexical binding destructuring",
    {
      source: `
        function test(a){
          for (let { length } in a) {
            return length;
          }
        }
      `,
      args: [{ value: 1 }],
      result: 5,
    },
  ],
];
