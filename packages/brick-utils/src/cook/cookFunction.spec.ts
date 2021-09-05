import { cloneDeep } from "lodash";
import { cookFunction } from "./cookFunction";
import { precookFunction } from "./precookFunction";

jest.spyOn(console, "warn").mockImplementation(() => void 0);

describe("cookFunction", () => {
  it.each<
    [string, { source: string; cases: { args: unknown[]; result: unknown }[] }]
  >([
    [
      "lexical variables in block statement",
      {
        source: `
          function test(a) {
            {
              let a;
              a = 9;
            }
            return a;
          }
        `,
        cases: [
          {
            args: [1],
            result: 1,
          },
        ],
      },
    ],
    [
      "lexical variables in block statement of if",
      {
        source: `
          function test(a) {
            if (true) {
              let a;
              a = 9;
            }
            return a;
          }
        `,
        cases: [
          {
            args: [1],
            result: 1,
          },
        ],
      },
    ],
    [
      "lexical variables in block statement of switch",
      {
        source: `
          function test(a) {
            switch (true) {
              case true:
                let a;
                a = 9;
            }
            return a;
          }
        `,
        cases: [
          {
            args: [1],
            result: 1,
          },
        ],
      },
    ],
    [
      "update param variables in block statement",
      {
        source: `
          function test(a) {
            {
              a = 9;
            }
            return a;
          }
        `,
        cases: [
          {
            args: [1],
            result: 9,
          },
        ],
      },
    ],
    [
      "update lexical variables in block statement",
      {
        source: `
          function test(a) {
            let b = a;
            {
              b = 9;
            }
            return b;
          }
        `,
        cases: [
          {
            args: [1],
            result: 9,
          },
        ],
      },
    ],
    [
      "switch statements: general",
      {
        source: `
          function test(a) {
            let b;
            switch(a) {
              case 1:
                b = 'A';
                break;
              case 2:
                b = 'B';
                break;
              case 9:
                b = 'X';
                return 'Z';
              default:
                b = 'C';
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
            result: "B",
          },
          {
            args: [3],
            result: "C",
          },
          {
            args: [9],
            result: "Z",
          },
        ],
      },
    ],
    [
      "switch statements: missing a break",
      {
        source: `
          function test(a) {
            let b = '';
            switch(a) {
              case 1:
                b += 'A';
              case 2:
                b += 'B';
                break;
              default:
                b = 'C';
            }
            return b;
          }
        `,
        cases: [
          {
            args: [1],
            result: "AB",
          },
          {
            args: [2],
            result: "B",
          },
          {
            args: [3],
            result: "C",
          },
        ],
      },
    ],
    [
      "switch statements: missing a break before default",
      {
        source: `
          function test(a) {
            let b = '';
            switch(a) {
              case 1:
                b += 'A';
                break;
              case 2:
                b += 'B';
              default:
                b += 'C';
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
            result: "BC",
          },
          {
            args: [3],
            result: "C",
          },
        ],
      },
    ],
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
    [
      "switch statements: case after default, and mutate discriminant",
      {
        source: `
        function test(a) {
          a.c = [];
          switch(a.b) {
            case 1:
              a.c.push('case 1');
              break;
            default:
              a.c.push('default');
              a.b = 2;
            case 2:
              a.c.push('case 2');
              a.b = 3;
          }
          return a;
        }
        `,
        cases: [
          {
            args: [{ b: 1 }],
            result: { b: 1, c: ["case 1"] },
          },
          {
            args: [{ b: 2 }],
            result: { b: 3, c: ["case 2"] },
          },
          {
            args: [{ b: 3 }],
            result: { b: 3, c: ["default", "case 2"] },
          },
        ],
      },
    ],
    [
      "if statements",
      {
        source: `
          function test(a) {
            if (a === 1) {
              return 'A';
            } else if (a === 2) {
              return 'B';
            } else if (a === 3) {
              return;
            } else {
              return 'C';
            }
          }
        `,
        cases: [
          {
            args: [1],
            result: "A",
          },
          {
            args: [2],
            result: "B",
          },
          {
            args: [3],
            result: undefined,
          },
          {
            args: [4],
            result: "C",
          },
        ],
      },
    ],
    [
      "object destructuring",
      {
        source: `
          function test(a, { r: d, ...e } = {}, ...f) {
            const { x: b = 9, ...c } = a;
            return {
              b,
              c,
              d,
              e,
              f
            };
          }
        `,
        cases: [
          {
            args: [
              {
                x: 1,
                y: 2,
                z: 3,
              },
              {
                r: 4,
                s: 5,
                t: 6,
              },
              7,
              8,
            ],
            result: {
              b: 1,
              c: {
                y: 2,
                z: 3,
              },
              d: 4,
              e: {
                s: 5,
                t: 6,
              },
              f: [7, 8],
            },
          },
          {
            args: [
              {
                y: 2,
                z: 3,
              },
            ],
            result: {
              b: 9,
              c: {
                y: 2,
                z: 3,
              },
              d: undefined,
              e: {},
              f: [],
            },
          },
        ],
      },
    ],
    [
      "array destructuring",
      {
        source: `
          function test(a, [d, ...e] = []) {
            const [ b = 9, ...c ] = a;
            return [ 0, ...c, b, d, e];
          }
        `,
        cases: [
          {
            args: [
              [1, 2, 3],
              [4, 5, 6],
            ],
            result: [0, 2, 3, 1, 4, [5, 6]],
          },
          {
            args: [[undefined, 2, 3]],
            result: [0, 2, 3, 9, undefined, []],
          },
        ],
      },
    ],
    [
      "recursive",
      {
        source: `
          function test(a) {
            return a + (a > 1 ? test(a - 1) : 0);
          }
        `,
        cases: [
          {
            args: [2],
            result: 3,
          },
          {
            args: [3],
            result: 6,
          },
        ],
      },
    ],
    [
      "var variables overload param variables",
      {
        source: `
          function test(a) {
            var a = 2;
            return a;
          }
        `,
        cases: [
          {
            args: [1],
            result: 2,
          },
        ],
      },
    ],
    [
      "functions overload params variables",
      {
        source: `
          function test(a) {
            function a() {}
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "function",
          },
        ],
      },
    ],
    [
      "var variables hoist in block statements",
      {
        source: `
          function test() {
            var b = typeof a;
            if (false) {
              var a;
            }
            return b;
          }
        `,
        cases: [
          {
            args: [],
            result: "undefined",
          },
        ],
      },
    ],
    [
      "functions after var variables initialized",
      {
        source: `
          function test(a) {
            var a = 'A';
            function a() {}
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "string",
          },
        ],
      },
    ],
    [
      "functions after var variables uninitialized",
      {
        source: `
          function test(a) {
            var a;
            function a() {}
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "function",
          },
        ],
      },
    ],
    [
      "functions before var variables initialized",
      {
        source: `
          function test(a) {
            function a() {}
            var a = 'A';
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "string",
          },
        ],
      },
    ],
    [
      "functions before var variables uninitialized",
      {
        source: `
          function test(a) {
            function a() {}
            var a;
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "function",
          },
        ],
      },
    ],
    [
      "functions before false conditional var variables initialized",
      {
        source: `
          function test(a) {
            function a() {}
            if (false) {
              var a = 'A';
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "function",
          },
        ],
      },
    ],
    [
      "functions before true conditional var variables initialized",
      {
        source: `
          function test(a) {
            function a() {}
            if (true) {
              var a = 'A';
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "string",
          },
        ],
      },
    ],
    [
      "functions before blocked var variables initialized",
      {
        source: `
          function test(a) {
            function a() {}
            {
              var a = 'A';
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "string",
          },
        ],
      },
    ],
    [
      "conditional functions after var variables uninitialized",
      {
        source: `
          function test(a) {
            var a;
            if (true) {
              function a() {}
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "number",
          },
        ],
      },
    ],
    [
      "conditional functions with param uninitialized",
      {
        source: `
          function test(a) {
            if (true) {
              function a() {}
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [],
            result: "undefined",
          },
        ],
      },
    ],
    [
      "blocked functions after var variables uninitialized",
      {
        source: `
          function test(a) {
            var a;
            {
              function a() {}
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "number",
          },
        ],
      },
    ],
    [
      "conditional functions after var variables uninitialized with no params",
      {
        source: `
          function test() {
            var a;
            if (true) {
              function a() {}
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [],
            result: "undefined",
          },
        ],
      },
    ],
    [
      "blocked functions after var variables uninitialized with no params",
      {
        source: `
          function test() {
            var a;
            {
              function a() {}
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [],
            result: "undefined",
          },
        ],
      },
    ],
    [
      "blocked functions",
      {
        source: `
          function test(a) {
            {
              function a() {}
            }
            return typeof a;
          }
        `,
        cases: [
          {
            args: [1],
            result: "number",
          },
        ],
      },
    ],
    [
      "hoisted functions",
      {
        source: `
          function test() {
            const t = a();
            function a() {
              return 1;
            }
            return t;
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
      "functions hoisting in block",
      {
        source: `
          function test() {
            const t = a();
            let r;
            if (true) {
              r = a();
              function a() {
                return 2;
              }
            }
            function a() {
              return 1;
            }
            return t + r;
          }
        `,
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
      },
    ],
    [
      "functions hoisting in switch statement",
      {
        source: `
          function test() {
            const t = a();
            let r;
            switch (true) {
              case true:
                r = a();
              case false:
                function a() { return 2 }
            }
            function a() {
              return 1;
            }
            return t + r;
          }
        `,
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
      },
    ],
    [
      "hoisted functions in function expressions",
      {
        source: `
          function test() {
            const f = function(){
              const t = a();
              let r;
              if (true) {
                r = a();
                function a() {
                  return 2;
                }
              }
              function a() {
                return 1;
              }
              return t + r;
            };
            return f();
          }
        `,
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
      },
    ],
    [
      "hoisted functions in arrow functions",
      {
        source: `
          function test() {
            const f = () => {
              const t = a();
              let r;
              if (true) {
                r = a();
                function a() {
                  return 2;
                }
              }
              function a() {
                return 1;
              }
              return t + r;
            };
            return f();
          }
        `,
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
      },
    ],
    [
      "for const ... of",
      {
        source: `
          function test() {
            let total = 0;
            for (const i of [1, 2]) {
              total += i;
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
      },
    ],
    [
      "for var ... of",
      {
        source: `
          function test() {
            let total = 0;
            for (var i of [1, 2]) {
              total += i;
            }
            return total + i;
          }
        `,
        cases: [
          {
            args: [],
            result: 5,
          },
        ],
      },
    ],
    [
      "for ... of",
      {
        source: `
          function test() {
            let total = 0;
            let i;
            for (i of [1, 2]) {
              total += i;
            }
            return total + i;
          }
        `,
        cases: [
          {
            args: [],
            result: 5,
          },
        ],
      },
    ],
    [
      "for ... of: nesting scopes",
      {
        source: `
          function test() {
            let total = '';
            const i = 'a';
            for (const i of ['b', 'c']) {
              const i = 'd';
              total += i;
            }
            return total + i;
          }
        `,
        cases: [
          {
            args: [],
            result: "dda",
          },
        ],
      },
    ],
    [
      "for let ... of: break",
      {
        source: `
          function test() {
            let total = 0;
            for (let i of [1, 2]) {
              total += i;
              if (total >= 1) {
                break;
                // Should never reach here.
                total += 10;
              }
            }
            return total;
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
      "for const ... of: continue",
      {
        source: `
          function test() {
            let total = 0;
            for (const i of [1, 2, 3]) {
              if (i === 2) {
                continue;
              }
              total += i;
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 4,
          },
        ],
      },
    ],
    [
      "for let ... in",
      {
        source: `
          function test() {
            let total = '';
            for (let i in {a:1,b:2}) {
              total += i;
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: "ab",
          },
        ],
      },
    ],
    [
      "for ... in",
      {
        source: `
          function test() {
            let total = '';
            var i;
            for (i in {a:1,b:2}) {
              total += i;
            }
            return total + i;
          }
        `,
        cases: [
          {
            args: [],
            result: "abb",
          },
        ],
      },
    ],
    [
      "for var ... in",
      {
        source: `
          function test() {
            let total = '';
            for (var i in {a:1,b:2}) {
              total += i;
            }
            return total + i;
          }
        `,
        cases: [
          {
            args: [],
            result: "abb",
          },
        ],
      },
    ],
    [
      "for const ... in: return",
      {
        source: `
          function test() {
            let total = '';
            for (let i in {a:1,b:2}) {
              total += i;
              if (total.length >= 1) {
                return 'oops: ' + total;
              }
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: "oops: a",
          },
        ],
      },
    ],
    [
      "for const ... in: continue",
      {
        source: `
          function test() {
            let total = '';
            for (const i in {a:1,b:2,c:3}) {
              if (i === 'b') {
                continue;
              }
              total += i;
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: "ac",
          },
        ],
      },
    ],
    [
      "for let ...",
      {
        source: `
          function test() {
            let total = 0;
            const list = [1, 2];
            for (let i = 0; i < list.length; i += 1) {
              total += list[i];
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
      },
    ],
    [
      "for var ...: break",
      {
        source: `
          function test() {
            let total = 0;
            const list = [1, 2];
            for (var i = 0; i < list.length; i += 1) {
              total += list[i];
              if (total >= 1) {
                break;
              }
            }
            return total + i;
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
      "for const ...: continue",
      {
        source: `
          function test() {
            let total = 0;
            const list = [1, 2, 3];
            for (let i = 0; i < list.length; i += 1) {
              if (i === 1) {
                continue;
              }
              total += list[i];
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 4,
          },
        ],
      },
    ],
    [
      "for ...: with no init nor test nor update",
      {
        source: `
          function test() {
            let total = 0;
            for (; ;) {
              total += 1;
              if (total >= 2) {
                break;
              }
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 2,
          },
        ],
      },
    ],
    [
      "for ...: nested",
      {
        source: `
          function test() {
            let total = 0;
            const list = [1, 2];
            const object = {a: 3, b: 4};
            for (const i of list) {
              total += i;
              for (const k in object) {
                total += object[k];
              }
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 17,
          },
        ],
      },
    ],
    [
      "for ...: nested and break inner",
      {
        source: `
          function test() {
            let total = 0;
            const list = [1, 2];
            const object = {a: 3, b: 4};
            for (const i of list) {
              total += i;
              for (const k in object) {
                total += object[k];
                break;
              }
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 9,
          },
        ],
      },
    ],
    [
      "for ...: nested and break outer",
      {
        source: `
          function test() {
            let total = 0;
            const list = [1, 2];
            const object = {a: 3, b: 4};
            for (const i of list) {
              total += i;
              for (const k in object) {
                total += object[k];
              }
              break;
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: 8,
          },
        ],
      },
    ],
    [
      "for ...: nested and return inner",
      {
        source: `
          function test() {
            let total = 0;
            const list = [1, 2];
            const object = {a: 3, b: 4};
            for (const i of list) {
              total += i;
              for (const k in object) {
                total += object[k];
                return "oops: " + total;
              }
              alert('yaks');
            }
            return total;
          }
        `,
        cases: [
          {
            args: [],
            result: "oops: 4",
          },
        ],
      },
    ],
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
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
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
        cases: [
          {
            args: [],
            result: 0,
          },
        ],
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
        cases: [
          {
            args: [],
            result: 2,
          },
        ],
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
        cases: [
          {
            args: [],
            result: 2,
          },
        ],
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
        cases: [
          {
            args: [],
            result: 3,
          },
        ],
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
        cases: [
          {
            args: [],
            result: 1,
          },
        ],
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
        cases: [
          {
            args: [],
            result: 2,
          },
        ],
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
        cases: [
          {
            args: [],
            result: 2,
          },
        ],
      },
    ],
    [
      "empty statement",
      {
        source: `
          function test() {
            ;
          }
        `,
        cases: [
          {
            args: [],
            result: undefined,
          },
        ],
      },
    ],
    [
      "try ... catch ... finally",
      {
        source: `
          function test() {
            let a = 1, b, c;
            try {
              b = 'yep';
              a();
              b = 'nope';
            } catch (e) {
              a = e.toString();
            } finally {
              c = a + ':' + b;
            }
            return c;
          }
        `,
        cases: [
          {
            args: [],
            result: "TypeError: a is not a function:yep",
          },
        ],
      },
    ],
    [
      "throw and catch",
      {
        source: `
          function test() {
            let a = 'yes';
            try {
              throw 'oops';
            } catch (e) {
              a = 'Error: ' + e;
            }
            return a;
          }
        `,
        cases: [
          {
            args: [],
            result: "Error: oops",
          },
        ],
      },
    ],
    [
      "assignment",
      {
        source: `
          function test() {
            let [a, b, c, d, e, f, i] = [10, 20, 30, 40, 50, 60, 70];
            const g = { h: 70 };
            let r = a;
            let s = (b += 1);
            let t = (c -= 1);
            let u = (d *= 2);
            let v = (e /= 2);
            let w = (f %= 7);
            let x = (g.h += 2);
            let y = (i **= 2);
            return [[a, b, c, d, e, f, g.h, i], [r, s, t, u, v, w, x, y]];
          }
        `,
        cases: [
          {
            args: [],
            result: [
              [10, 21, 29, 80, 25, 4, 72, 4900],
              [10, 21, 29, 80, 25, 4, 72, 4900],
            ],
          },
        ],
      },
    ],
    [
      "update",
      {
        source: `
          function test() {
            let [a, b, c, d] = [10, 20, 30, 40];
            let r = a++;
            let s = ++b;
            let t = c--;
            let u = --d;
            return [ [a, b, c, d], [r, s, t, u] ];
          }
        `,
        cases: [
          {
            args: [],
            result: [
              [11, 21, 29, 39],
              [10, 21, 30, 39],
            ],
          },
        ],
      },
    ],
    [
      "arrow function expression",
      {
        source: `
          function test(a) {
            return a.map(b => b.name);
          }
        `,
        cases: [
          {
            args: [
              [
                { name: "sayHello", description: "Hello" },
                { name: "sayExclamation", description: "Exclamation" },
              ],
            ],
            result: ["sayHello", "sayExclamation"],
          },
        ],
      },
    ],
    [
      "delete",
      {
        source: `
          function test(a) {
            const d = delete a.b;
            const e = delete a.f;
            return { ...a, d, e };
          }
        `,
        cases: [
          {
            args: [{ b: 1, c: 2 }],
            result: { c: 2, d: true, e: true },
          },
        ],
      },
    ],
    [
      "[TypeScript]",
      {
        source: `
          interface A {
            b: number;
          }
          type B = A & {
            c: string;
          }
          declare function f(): void;
          function test({ b, c }: B): void {
            return { b: c as number, c: b };
          }
        `,
        cases: [
          {
            args: [{ b: 1, c: 2 }],
            result: { b: 2, c: 1 },
          },
        ],
      },
    ],
  ])("%s", (desc, { source, cases }) => {
    const typescript = desc.startsWith("[TypeScript]");
    const func = cookFunction(
      precookFunction(
        source,
        typescript
          ? {
              typescript,
            }
          : undefined
      )
    );
    for (const { args, result } of cases) {
      if (!typescript) {
        const equivalentFunc = new Function(
          `"use strict"; return (${source})`
        )();
        expect(equivalentFunc(...cloneDeep(args))).toEqual(result);
      }
      expect(func(...cloneDeep(args))).toEqual(result);
    }
  });

  it("access global functions", () => {
    const source = `
      function test(name) {
        return FN.sayHello(name) + "!"
      }
    `;
    const func = cookFunction(precookFunction(source), {
      globalVariables: {
        FN: {
          sayHello(name: string) {
            return `Hello, ${name}`;
          },
        },
      },
    });
    expect(func("world")).toEqual("Hello, world!");
  });

  it("throw if restrict no war usage", () => {
    const source = `
      function test() {
        var a = 1;
        return a;
      }
    `;
    const equivalentFunc = new Function(`"use strict"; return (${source})`)();
    expect(() => equivalentFunc()).not.toThrowError();
    expect(() => {
      const func = cookFunction(precookFunction(source), {
        rules: {
          noVar: true,
        },
      });
      func();
    }).toThrowErrorMatchingSnapshot();
  });

  it.each<[desc: string, source: string]>([
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
          let a = typeof b;
          let b;
          return a;
        }
      `,
    ],
  ])("%s should throw", (desc, source) => {
    const equivalentFunc = new Function(`"use strict"; return (${source})`)();
    expect(() => equivalentFunc()).toThrowError();
    expect(() => {
      const func = cookFunction(precookFunction(source));
      func();
    }).toThrowErrorMatchingSnapshot();
  });

  it.each<[desc: string, source: string]>([
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
  ])("%s should throw", (desc, source) => {
    const equivalentFunc = new Function(`"use strict"; return (${source})`)();
    expect(() => equivalentFunc()).not.toThrowError();
    expect(() => {
      const func = cookFunction(precookFunction(source));
      func();
    }).toThrowErrorMatchingSnapshot();
  });

  it.each<[desc: string, source: string]>([
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
  ])("%s should throw", (desc, source) => {
    expect(() => {
      const func = cookFunction(
        precookFunction(source, {
          typescript: desc.startsWith("[TypeScript]"),
        })
      );
      func();
    }).toThrowErrorMatchingSnapshot();
  });
});
