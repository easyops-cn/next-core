import { LooseCase } from "./interfaces.js";

export const casesOfSwitchStatements: LooseCase[] = [
  [
    "switch statements: case after default",
    {
      source: `
        function test(a) {
          let b = '';
          switch(a) {
            case 1:
              b += 'A';
              break;
            default:
              b += 'C';
            case 2:
              b += 'B';
            case 4:
              b += 'D';
              break;
            case 5:
              b += 'E';
          }
          return b;
        }
      `,
      cases: [
        {
          args: [1],
          result: "A",
        },
        {
          args: [2],
          result: "BD",
        },
        {
          args: [3],
          result: "CBD",
        },
        {
          args: [4],
          result: "D",
        },
        {
          args: [5],
          result: "E",
        },
      ],
    },
  ],
];
