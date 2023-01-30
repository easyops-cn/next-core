import { LooseCase } from "../interfaces.js";

export const casesOfForOfLoops: LooseCase[] = [
  [
    "for of loop: if/else/break/continue/return",
    {
      source: `
        function test(a, p = []){
          for (const x of a) {
            p.push(0);
            if (x === 0) {
              p.push(1);
              continue;
              p.push(2);
            }
            p.push(3);
            if (x === 1)
              continue;
            p.push(4);
            if (x === 2) {
              p.push(5);
              break;
              p.push(6);
            }
            p.push(7);
            if (x === 3)
              return p;
            p.push(8);
            if (x === 4) {
              p.push(9);
              return p;
              p.push(10);
            } else if (x===5) {
              p.push(11);
            } else {
              p.push(13);
            }
            p.push(14);
          }
          p.push(15);
          return p;
          p.push(16);
        }
      `,
      cases: [
        {
          args: [[0, 1, 2, 3, 4]],
          result: [0, 1, 0, 3, 0, 3, 4, 5, 15],
        },
        {
          args: [[3, 4, 5]],
          result: [0, 3, 4, 7],
        },
        {
          args: [[4, 5]],
          result: [0, 3, 4, 7, 8, 9],
        },
        {
          args: [[5, 6]],
          result: [0, 3, 4, 7, 8, 11, 14, 0, 3, 4, 7, 8, 13, 14, 15],
        },
      ],
    },
  ],
  [
    "for of loop: break",
    {
      source: `
        function test(a){
          for (const x of a) {
            break;
            return 'after break';
          }
          return 'last';
        }
      `,
      args: [[1]],
      result: "last",
    },
  ],
  [
    "for of loop: continue",
    {
      source: `
        function test(a){
          for (const x of a) {
            continue;
            return 'after break';
          }
          return 'last';
        }
      `,
      args: [[1]],
      result: "last",
    },
  ],
  [
    "for of loop: iterate destructure as lexical binding",
    {
      source: `
        function test(a){
          for (const [x,,[y,...z]] of a) {
            return [x,,y,z,,];
          }
        }
      `,
      args: [[[0, 1, [2, 3, 4]]]],
      // eslint-disable-next-line no-sparse-arrays
      result: [0, , 2, [3, 4], ,],
    },
  ],
  [
    "for of loop: iterate destructure as lexical binding with init",
    {
      source: `
        function test(a){
          for (const [x,,[y,...z]=[2,3,4]] of a) {
            return [x,y,z];
          }
        }
      `,
      args: [[[0, 1]]],
      result: [0, 2, [3, 4]],
    },
  ],
  [
    "for of loop: iterate destructure as var binding",
    {
      source: `
        function test(a){
          for (var [x,,[y,...z]] of a) {
            return [x,,y,z,,];
          }
        }
      `,
      args: [[[0, 1, [2, 3, 4]]]],
      // eslint-disable-next-line no-sparse-arrays
      result: [0, , 2, [3, 4], ,],
    },
  ],
  [
    "for of loop: iterate destructure as var binding with init",
    {
      source: `
        function test(a){
          for (var [x,,[y,...z]=[2,3,4]] of a) {
            return [x,y,z];
          }
        }
      `,
      args: [[[0, 1]]],
      result: [0, 2, [3, 4]],
    },
  ],
  [
    "for of loop: iterate destructure as assignment to var declarations",
    {
      source: `
        function test(a){
          var x, y, z;
          for ([x,,[y,...z]] of a) {
            return [x,,y,z,,];
          }
        }
      `,
      args: [[[0, 1, [2, 3, 4]]]],
      // eslint-disable-next-line no-sparse-arrays
      result: [0, , 2, [3, 4], ,],
    },
  ],
  [
    "for of loop: iterate destructure as assignment to var declarations with init",
    {
      source: `
        function test(a){
          var x, y, z;
          for ([x,,[y,...z]=[2,3,4]] of a) {
            return [x,y,z];
          }
        }
      `,
      args: [[[0, 1]]],
      result: [0, 2, [3, 4]],
    },
  ],
  [
    "for of loop: iterate destructure as assignment to lexical declarations",
    {
      source: `
        function test(a){
          let x, y, z;
          for ([x,,[y,...z]] of a) {
            return [x,,y,z,,];
          }
        }
      `,
      args: [[[0, 1, [2, 3, 4]]]],
      // eslint-disable-next-line no-sparse-arrays
      result: [0, , 2, [3, 4], ,],
    },
  ],
  [
    "for of loop: enumerate destructure",
    {
      source: `
        function test(a){
          for (const {b,c:d,e:{f:g}} of a) {
            return [b,d,g];
          }
        }
      `,
      args: [[{ b: 1, c: 2, e: { f: 3 } }]],
      result: [1, 2, 3],
    },
  ],
  [
    "for of loop: enumerate destructure with init",
    {
      source: `
        function test(a){
          for (const {b=1,c:d=2,e:{f:g=3}={}} of a) {
            return [b,d,g];
          }
        }
      `,
      args: [[{}]],
      result: [1, 2, 3],
    },
  ],
  [
    "for of loop: break iterable",
    {
      source: `
        function test(){
          const list = [];
          const iterable = DATA.getIterable();

          for (const item of iterable) {
            list.push(item);
            if (item === 1) {
              break;
            }
          }

          for (const item of iterable) {
            list.push(item);
          }

          return list;
        }
      `,
      args: [],
      result: [1, 1, 2],
    },
  ],
];
