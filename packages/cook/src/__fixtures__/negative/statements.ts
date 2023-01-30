import { LooseCase } from "../interfaces.js";

export const negativeCasesOfStatements: LooseCase[] = [
  [
    "assign constants",
    `
      function test(){
        const a = 1;
        a = 2;
      }
    `,
  ],
  [
    "assign global functions",
    `
      function test(){
        test = 1;
      }
    `,
  ],
  [
    "assign function expressions",
    `
      function test(){
        (function f(){
          f = 1;
        })();
      }
    `,
  ],
  [
    "assign `for const ... of`",
    `
      function test(){
        for (const i of [1]) {
          i = 2;
        }
      }
    `,
  ],
  [
    "assign `for const ...`",
    `
      function test(){
        for (const i=0; i<2; i+=1) {
          i = 2;
        }
      }
    `,
  ],
  [
    "try without catch",
    `
      function test() {
        let a = 1, b, c;
        try {
          b = 'yep';
          a();
          b = 'nope';
        } finally {
          c = a + ':' + b;
        }
        return c;
      }
    `,
  ],
  [
    "assign member of nil",
    `
      function test() {
        let a;
        a.b = 1;
      }
    `,
  ],
  [
    "access before initialized",
    `
      function test() {
        let a = b;
        let b;
      }
    `,
  ],
  [
    "assign before initialized",
    `
      function test() {
        a = 1;
        let a;
      }
    `,
  ],
  [
    "assign variables not defined",
    `
      function test() {
        a = 1;
      }
    `,
  ],
].map(([desc, source]) => [
  desc,
  {
    source,
    args: [],
  },
]);

export const selectiveNegativeCasesOfStatements: LooseCase[] = [
  [
    "async functions",
    `
      async function test(){}
    `,
  ],
  [
    "generator functions",
    `
      function* test(){}
    `,
  ],
  [
    "bitwise and assignment",
    `
      function test() {
        let a = 1, b = 2;
        b &= a;
        return b;
      }
    `,
  ],
  [
    "labeled statement",
    `
      function test() {
        loop:
        for (let i = 0; i < 1; i++) {}
      }
    `,
  ],
  [
    "[TypeScript] enum",
    `
      enum C {}
      function test(){}
    `,
  ],
  [
    "[TypeScript] interface only",
    `
      interface A {}
    `,
  ],
  [
    "Use interfaces in JavaScript",
    `
      interface A {}
      function test(){}
    `,
  ],
  [
    "for of loop: break iterable",
    `
      function test(){
        const list = [];
        const iterable = DATA.getIterable(true);

        for (const item of iterable) {
          list.push(item);
          if (item === 1) {
            break;
          }
        }

        return list;
      }
    `,
  ],
].map(([desc, source]) => [
  desc,
  {
    source,
    args: [],
  },
]);
