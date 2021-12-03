import { LooseCase } from "./interfaces";

export const casesOfTryStatements: LooseCase[] = [
  [
    "try ... catch ... finally",
    {
      source: `
        function test() {
          let a = 1, b, c;
          while (true) {
            try {
              b = 'yep';
              a();
              b = 'nope';
            } catch (e) {
              a = e.toString();
            } finally {
              c = a + ':' + b;
              break;
            }
            return c;
          }
          return 'Finally: ' + c;
        }
      `,
      args: [],
      result: "Finally: TypeError: a is not a function:yep",
    },
  ],
  [
    "throw and catch",
    {
      source: `
        function test() {
          let a = 'yes';
          while (true) {
            try {
              throw 'oops';
            } catch (e) {
              a = 'Error: ' + e;
              break;
            }
            return a;
          }
          return 'Caught: ' + a;
        }
      `,
      args: [],
      result: "Caught: Error: oops",
    },
  ],
  [
    "generator",
    {
      source: `
        function test() {
          function* G() {
            let a = yield 1;
            let b = yield 2;
            return { a, b};
          }
          let g = G();
          let x = g.next().value;
          let y = g.next('x:'+x).value;
          return { x, y, z: g.next(y) }
        }
      `,
      args: [],
      result: {
        x: 1,
        y: 2,
        z: {
          value: {
            a: "x:1",
            b: 2,
          },
          done: true,
        },
      },
    },
  ],
];
