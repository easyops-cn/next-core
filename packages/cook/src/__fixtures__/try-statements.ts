import { LooseCase } from "./interfaces.js";

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
];
