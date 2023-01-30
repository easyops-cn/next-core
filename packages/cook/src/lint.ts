/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type FunctionDeclaration,
  SourceLocation,
  Statement,
} from "@babel/types";
import type { CookRules, ParseResultOfFile } from "./interfaces.js";
import { parseForAnalysis } from "./parseForAnalysis.js";
import { precook } from "./precook.js";

export interface LintOptions {
  typescript?: boolean;
  rules?: CookRules;
}

export interface LintError {
  type: "SyntaxError" | "TypeError";
  message: string;
  loc: SourceLocation;
}

/** For next-core internal or devtools usage only. */
export function lint(
  source: string | ParseResultOfFile | null,
  { typescript, rules }: LintOptions = {}
): LintError[] {
  const errors: LintError[] = [];
  const file =
    typeof source === "string"
      ? parseForAnalysis(source, { typescript })
      : source;
  if (!file) {
    // Return no errors if parse failed.
    return errors;
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
            loc: node.loc!,
          });
        }
      } else {
        jsNodes.push(node);
      }
    }
  }
  let func: FunctionDeclaration | undefined;
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
        loc: node.loc!,
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
    precook(func, {
      hooks: {
        beforeVisit(node) {
          switch (node.type) {
            case "ArrowFunctionExpression":
            case "FunctionDeclaration":
            case "FunctionExpression":
              if (node.async || node.generator) {
                errors.push({
                  type: "SyntaxError",
                  message: `${
                    node.async ? "Async" : "Generator"
                  } function is not allowed`,
                  loc: node.loc!,
                });
              }
              break;
            case "Literal":
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
              break;
            case "ObjectExpression":
              for (const prop of node.properties) {
                if (prop.type === "Property") {
                  if (prop.kind !== "init") {
                    errors.push({
                      type: "SyntaxError",
                      message: "Unsupported object getter/setter property",
                      loc: prop.loc!,
                    });
                  } else if (
                    !prop.computed &&
                    prop.key.type === "Identifier" &&
                    prop.key.name === "__proto__"
                  ) {
                    errors.push({
                      type: "TypeError",
                      message: "Setting '__proto__' property is not allowed",
                      loc: prop.key.loc!,
                    });
                  }
                }
              }
              break;
            case "VariableDeclaration":
              if (node.kind === "var" && rules?.noVar) {
                errors.push({
                  type: "SyntaxError",
                  message:
                    "Var declaration is not recommended, use `let` or `const` instead",
                  loc: {
                    start: node.loc!.start,
                    end: {
                      line: node.loc!.start.line,
                      // Only decorate the "var".
                      column: node.loc!.start.column + 3,
                    },
                  },
                });
              }
              break;
          }
        },
        beforeVisitGlobal(node) {
          if (node.name === "arguments") {
            errors.push({
              type: "SyntaxError",
              message: "Use the rest parameters instead of 'arguments'",
              loc: node.loc!,
            });
          }
        },
        beforeVisitUnknown(node) {
          errors.push({
            type: "SyntaxError",
            message: `Unsupported syntax: \`${node.type}\``,
            loc: node.loc!,
          });
          return true;
        },
      },
    });
  }
  return errors;
}
