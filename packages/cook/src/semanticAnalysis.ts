import { parse, ParseResult, ParserPlugin } from "@babel/parser";
import {
  ArrowFunctionExpression,
  CallExpression,
  File,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  SourceLocation,
  Statement,
  VariableDeclaration,
} from "@babel/types";
import {
  EstreeLiteral,
  CookRules,
  EstreeObjectExpression,
  EstreeVisitorFn,
  EstreeNode,
} from "./interfaces";
import { precook } from "./precook";

export interface SemanticAnalysisOptions {
  typescript?: boolean;
  rules?: CookRules;
  highlight?: boolean;
}

export interface SemanticAnalysisResult {
  parseFailed?: boolean;
  errors: LintError[];
  highlights: SemanticHighlights;
}

export interface LintError {
  type: "SyntaxError" | "TypeError";
  message: string;
  loc: SourceLocation;
}

export interface SemanticHighlights {
  functionNames: CodeRange[];
}

export interface CodeRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

/** For next-core internal or devtools usage only. */
export function semanticAnalysis(
  source: string,
  { typescript, rules, highlight }: SemanticAnalysisOptions = {}
): SemanticAnalysisResult {
  const errors: LintError[] = [];
  const highlights: SemanticHighlights = {
    functionNames: [],
  };
  let file: ParseResult<File>;
  try {
    file = parse(source, {
      plugins: (["estree"] as ParserPlugin[]).concat(
        typescript ? "typescript" : []
      ),
      strictMode: true,
      attachComment: false,
      // Allow export/import declarations to make linter handle errors.
      sourceType: "unambiguous",
    });
  } catch (e) {
    // Return no errors if parse failed.
    return {
      parseFailed: true,
      errors,
      highlights,
    };
  }
  const body = file.program.body;
  const jsNodes: Statement[] = typescript ? [] : body;
  if (typescript) {
    for (const node of body) {
      if (node.type.startsWith("TS")) {
        if (/Enum|Import|Export/.test(node.type)) {
          errors.push({
            type: "SyntaxError",
            message: `Unsupported TypeScript syntax: \`${node.type}\``,
            loc: node.loc,
          });
        }
      } else {
        jsNodes.push(node);
      }
    }
  }
  let func: FunctionDeclaration;
  for (const node of jsNodes) {
    const isFunctionDeclaration = node.type === "FunctionDeclaration";
    if (isFunctionDeclaration && !func) {
      func = node;
    } else {
      errors.push({
        type: "SyntaxError",
        message: isFunctionDeclaration
          ? "Expect a single function declaration"
          : `\`${node.type}\` is not allowed in top level`,
        loc: node.loc,
      });
    }
  }
  if (!func) {
    errors.unshift({
      type: "SyntaxError",
      message: "Function declaration not found",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 0 },
      },
    });
  } else {
    const FunctionVisitor: EstreeVisitorFn = (
      node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
    ) => {
      if (node.async || node.generator) {
        errors.push({
          type: "SyntaxError",
          message: `${
            node.async ? "Async" : "Generator"
          } function is not allowed`,
          loc: node.loc,
        });
      }
      if (highlight && (node as FunctionDeclaration).id) {
        highlights.functionNames.push(
          getCodeRange((node as FunctionDeclaration).id)
        );
      }
    };
    precook(func, {
      visitors: {
        ArrowFunctionExpression: FunctionVisitor,
        FunctionDeclaration: FunctionVisitor,
        FunctionExpression: FunctionVisitor,
        CallExpression(node: CallExpression) {
          if (highlight) {
            if (node.callee.type === "MemberExpression") {
              if (
                !node.callee.computed &&
                node.callee.property.type === "Identifier"
              ) {
                highlights.functionNames.push(
                  getCodeRange(node.callee.property)
                );
              }
            } else if (node.callee.type === "Identifier") {
              highlights.functionNames.push(getCodeRange(node.callee));
            }
          }
        },
        Literal(node: EstreeLiteral) {
          if (node.regex) {
            if (node.value === null) {
              errors.push({
                type: "SyntaxError",
                message: "Invalid regular expression",
                loc: node.loc,
              });
            } else if (node.regex.flags.includes("u")) {
              errors.push({
                type: "SyntaxError",
                message: "Unsupported unicode flag in regular expression",
                loc: node.loc,
              });
            }
          }
        },
        ObjectExpression(node: EstreeObjectExpression) {
          for (const prop of node.properties) {
            if (prop.type === "Property") {
              if (prop.kind !== "init") {
                errors.push({
                  type: "SyntaxError",
                  message: "Unsupported object getter/setter property",
                  loc: prop.loc,
                });
              } else if (
                !prop.computed &&
                prop.key.type === "Identifier" &&
                prop.key.name === "__proto__"
              ) {
                errors.push({
                  type: "TypeError",
                  message: "Setting '__proto__' property is not allowed",
                  loc: prop.key.loc,
                });
              }
            }
          }
        },
        VariableDeclaration(node: VariableDeclaration) {
          if (node.kind === "var" && rules?.noVar) {
            errors.push({
              type: "SyntaxError",
              message:
                "Var declaration is not recommended, use `let` or `const` instead",
              loc: {
                start: node.loc.start,
                end: {
                  line: node.loc.end.line,
                  // Only decorate the "var".
                  column: node.loc.start.column + 3,
                },
              },
            });
          }
        },
        __UnknownNode(node: EstreeNode) {
          errors.push({
            type: "SyntaxError",
            message: `Unsupported syntax: \`${node.type}\``,
            loc: node.loc,
          });
        },
        __GlobalVariable(node: Identifier) {
          if (node.name === "arguments") {
            errors.push({
              type: "SyntaxError",
              message: "Use the rest parameters instead of 'arguments'",
              loc: node.loc,
            });
          }
        },
      },
    });
  }
  return {
    errors,
    highlights,
  };
}

function getCodeRange(node: EstreeNode): CodeRange {
  return {
    startLineNumber: node.loc.start.line,
    startColumn: node.loc.start.column + 1,
    endLineNumber: node.loc.end.line,
    endColumn: node.loc.end.column + 1,
  };
}
