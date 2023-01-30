import { LooseCase } from "./interfaces.js";

export const casesOfMigrated: LooseCase[] = [
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
    "switch statements: in for …",
    {
      source: `
      function test() {
        let total = 0;
        for (const i of [1, 2, 3]) {
          switch (i) {
            case 1:
              break;
            case 2:
              continue;
            default:
              break;
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
    "for ...: continue",
    {
      source: `
        function test() {
          let total = 0, i;
          const list = [1, 2, 3];
          for (i = 0; i < list.length; i += 1) {
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
          } finally {}
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
          var { g } = {};
          const i = delete g?.h;
          const j = delete DATA.objectC.C3;
          return { ...a, d, e, i, j };
        }
      `,
      cases: [
        {
          args: [{ b: 1, c: 2 }],
          result: { c: 2, d: true, e: true, i: true, j: true },
        },
      ],
    },
  ],
  [
    "parameter expression scope read",
    {
      source: `
        function test() {
          var x = 1;
          var y = 2;
          function inner(b = x + y) {
            var y = 3;
            return b;
          }
          return inner();
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
    "parameter expression scope write",
    {
      source: `
        function test() {
          var x = 1;
          var y = 2;
          function inner(x, b = (x = y)) {
            var y = 3;
            return b;
          }
          return x + ':' + inner();
        }
      `,
      cases: [
        {
          args: [],
          result: "1:2",
        },
      ],
    },
  ],
  [
    "parameter expression scope read in function",
    {
      source: `
        function test() {
          var x = 1;
          function inner(y, b = () => x + y) {
            var y = 2;
            return b();
          }
          return inner(3);
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
    "parameter expression scope write in function",
    {
      source: `
        function test() {
          var y = 1;
          function inner(b = () => (y=2)) {
            var y;
            b();
            return y;
          }
          return inner() + ':' + y;
        }
      `,
      cases: [
        {
          args: [],
          result: `undefined:2`,
        },
      ],
    },
  ],
  [
    "iterator destructuring assignment",
    {
      source: `
        function test() {
          const x = { a: 0 };
          let y, z, size;
          const v = [1, 2, 3, 4];
          [x.b, ...[y, ...z]] = v;
          [, x.a, ...{ length: size }] = v;
          return { x, y, z, size };
        }
      `,
      cases: [
        {
          args: [],
          result: { x: { a: 2, b: 1 }, y: 2, z: [3, 4], size: 2 },
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
];
