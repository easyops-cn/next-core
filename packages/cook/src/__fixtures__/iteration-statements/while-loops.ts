import { LooseCase } from "../interfaces.js";

export const casesOfWhileLoops: LooseCase[] = [
  [
    "while ...",
    {
      source: `
        function test() {
          let total = 0;
          while (total <= 2) {
            total += 1;
          }
          return total;
        }
      `,
      args: [],
      result: 3,
    },
  ],
  [
    "while ... false",
    {
      source: `
        function test() {
          let total = 0;
          while (false) {
            total += 1;
          }
          return total;
        }
      `,
      args: [],
      result: 0,
    },
  ],
  [
    "while ...: break",
    {
      source: `
        function test() {
          let total = 0;
          while (true) {
            total += 1;
            if (total >= 2) {
              break;
            }
          }
          return total;
        }
      `,
      args: [],
      result: 2,
    },
  ],
  [
    "while ...: continue",
    {
      source: `
        function test() {
          let total = 0;
          while (total < 2) {
            if (total >= 2) {
              continue;
            }
            total += 1;
          }
          return total;
        }
      `,
      args: [],
      result: 2,
    },
  ],
  [
    "while ...: empty completion record",
    {
      source: `
        function test() {
          let a = 1;
          while (a) {
            [a]=[0];
            continue;
          }
          return a;
        }
      `,
      args: [],
      result: 0,
    },
  ],
  [
    "do ... while",
    {
      source: `
        function test() {
          let total = 0;
          do {
            total += 1;
          } while (total <= 2);
          return total;
        }
      `,
      args: [],
      result: 3,
    },
  ],
  [
    "do ... while false",
    {
      source: `
        function test() {
          let total = 0;
          do {
            total += 1;
          } while (false);
          return total;
        }
      `,
      args: [],
      result: 1,
    },
  ],
  [
    "do ... while: break",
    {
      source: `
        function test() {
          let total = 0;
          do {
            total += 1;
            if (total >= 2) {
              break;
            }
          } while (true);
          return total;
        }
      `,
      args: [],
      result: 2,
    },
  ],
  [
    "do ... while: continue",
    {
      source: `
        function test() {
          let total = 0;
          do {
            if (total >= 2) {
              continue;
            }
            total += 1;
          } while (total < 2);
          return total;
        }
      `,
      args: [],
      result: 2,
    },
  ],
  [
    "do ... while: empty completion record",
    {
      source: `
        function test() {
          let a = 1;
          do {
            [a]=[0];
            continue;
          } while (a)
          return a;
        }
      `,
      args: [],
      result: 0,
    },
  ],
];
