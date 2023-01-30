import { parseForAnalysis } from "./parseForAnalysis.js";
import { lint, LintError } from "./lint.js";

describe("lint", () => {
  it.each<[desc: string, source: string, errors: LintError[]]>([
    ["Valid function", `function test(){ return "a" }`, []],
    [
      "Empty source",
      ``,
      [
        {
          type: "SyntaxError",
          message: "Function declaration not found",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 0 },
          },
        },
      ],
    ],
    ["Parse failed", `let package`, []],
    [
      "Async function",
      `async function test(){}`,
      [
        {
          type: "SyntaxError",
          message: "Async function is not allowed",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 23 },
          },
        },
      ],
    ],
    [
      "Generator function",
      `function* test(){}`,
      [
        {
          type: "SyntaxError",
          message: "Generator function is not allowed",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 18 },
          },
        },
      ],
    ],
    [
      "Export declaration",
      `export function test(){}`,
      [
        {
          type: "SyntaxError",
          message: "Function declaration not found",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 0 },
          },
        },
        {
          type: "SyntaxError",
          message: "`ExportNamedDeclaration` is not allowed in top level",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 24 },
          },
        },
      ],
    ],
    [
      "Var declarations",
      `
        function test(){
          var a;
        }
      `,
      [],
    ],
    [
      "[noVar] var declarations",
      `
        function test(){
          var a;
        }
      `,
      [
        {
          type: "SyntaxError",
          message:
            "Var declaration is not recommended, use `let` or `const` instead",
          loc: {
            start: { line: 3, column: 10 },
            end: { line: 3, column: 13 },
          },
        },
      ],
    ],
    [
      "[noVar] var declarations in multi-line",
      `
        function test(){
          var a,
              b;
        }
      `,
      [
        {
          type: "SyntaxError",
          message:
            "Var declaration is not recommended, use `let` or `const` instead",
          loc: {
            start: { line: 3, column: 10 },
            end: { line: 3, column: 13 },
          },
        },
      ],
    ],
    [
      "[noVar] let/const declarations",
      `
        function test(){
          let a = 1;
          const b = 2;
        }
      `,
      [],
    ],
    [
      "Valid regular expression",
      `
        function test(){
          return /bc/;
        }
      `,
      [],
    ],
    [
      "Invalid regular expression",
      `
        function test(){
          return /bc\\\\u{/u;
        }
      `,
      [
        {
          type: "SyntaxError",
          message: "Invalid regular expression",
          loc: {
            start: { line: 3, column: 17 },
            end: { line: 3, column: 26 },
          },
        },
      ],
    ],
    [
      "Unicode flag in regular expression",
      `
        function test(){
          return /bc\\\\u{13}/u;
        }
      `,
      [
        {
          type: "SyntaxError",
          message: "Unsupported unicode flag in regular expression",
          loc: {
            start: { line: 3, column: 17 },
            end: { line: 3, column: 29 },
          },
        },
      ],
    ],
    [
      "Object getter/setter property",
      `
        function test(b){
          return {
            get a() {
              return b.v;
            },
            set a(v) {
              b.v = v;
            },
            ...c,
          };
        }
      `,
      [
        {
          type: "SyntaxError",
          message: "Unsupported object getter/setter property",
          loc: {
            start: { line: 4, column: 12 },
            end: { line: 6, column: 13 },
          },
        },
        {
          type: "SyntaxError",
          message: "Unsupported object getter/setter property",
          loc: {
            start: { line: 7, column: 12 },
            end: { line: 9, column: 13 },
          },
        },
      ],
    ],
    [
      "Object '__proto__' property",
      `
        function test(b){
          return {
            __proto__: b,
            [c]: c,
          }
        }
      `,
      [
        {
          type: "TypeError",
          message: "Setting '__proto__' property is not allowed",
          loc: {
            start: { line: 4, column: 12 },
            end: { line: 4, column: 21 },
          },
        },
      ],
    ],
    [
      "Multiple functions",
      `
        function test(){}
        function anotherTest(){}
      `,
      [
        {
          type: "SyntaxError",
          message: "Expect a single function declaration",
          loc: {
            start: { line: 3, column: 8 },
            end: { line: 3, column: 32 },
          },
        },
      ],
    ],
    [
      "Using 'arguments'",
      `
        function test(){
          return arguments;
        }
      `,
      [
        {
          type: "SyntaxError",
          message: "Use the rest parameters instead of 'arguments'",
          loc: {
            start: { line: 3, column: 17 },
            end: { line: 3, column: 26 },
          },
        },
      ],
    ],
    [
      "Debugger statement",
      `
        function test(){
          debugger;
        }
      `,
      [
        {
          type: "SyntaxError",
          message: "Unsupported syntax: `DebuggerStatement`",
          loc: {
            start: { line: 3, column: 10 },
            end: { line: 3, column: 19 },
          },
        },
      ],
    ],
    [
      "invalid top level nodes with no functions",
      `let a`,
      [
        {
          type: "SyntaxError",
          message: "Function declaration not found",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 0 },
          },
        },
        {
          type: "SyntaxError",
          message: "`VariableDeclaration` is not allowed in top level",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 5 },
          },
        },
      ],
    ],
    [
      "[TypeScript] interface",
      `
        interface Data { A: string }
        function test(){}
      `,
      [],
    ],
    [
      "[TypeScript] enum",
      `
        enum Data { A, B }
        function test(){}
      `,
      [
        {
          type: "SyntaxError",
          message: "Unsupported TypeScript syntax: `TSEnumDeclaration`",
          loc: {
            start: { line: 2, column: 8 },
            end: { line: 2, column: 26 },
          },
        },
      ],
    ],
  ])("%s", (desc, source, errors) => {
    const typescript = desc.includes("[TypeScript]");
    const noVar = desc.includes("[noVar]");
    expect(
      lint(
        source,
        typescript || noVar ? { typescript, rules: { noVar } } : undefined
      )
    ).toMatchObject(errors);
  });

  it("should lint AST", () => {
    expect(lint(parseForAnalysis("function* test(){}"))).toMatchObject([
      {
        type: "SyntaxError",
        message: "Generator function is not allowed",
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 18 },
        },
      },
    ]);
  });
});
