import { cook, isSnippetEvaluation, preevaluate } from "@next-core/cook";
import { PrecookHooks } from "./cook";
import { supply } from "@next-core/supply";
import { visitStoryboardExpressions } from "./visitStoryboard";
import { RuntimeSnippet, SnippetContext } from "@next-core/brick-types";
import { isObject } from "./isObject";

function beforeVisitSnippetParamsFactory(
  collection: Set<string>
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitParams(node, parent): void {
    if (node.name === "SNIPPET_PARAMS") {
      const memberParent = parent[parent.length - 1];

      if (
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object"
      ) {
        if (
          !memberParent.node.computed &&
          memberParent.node.property.type === "Identifier"
        ) {
          collection.add((memberParent.node.property as any).name);
        } else if (
          memberParent.node.computed &&
          (memberParent.node.property as any).type === "Literal"
        ) {
          collection.add((memberParent.node.property as any).value);
        }
      }
    }
  };
}

function checkParamsValid(nameList: string[], context: SnippetContext): void {
  const { declareParams = {}, inputParams = {} } = context;
  return nameList.forEach((name) => {
    const type = declareParams[name]?.type;

    if (!type) {
      throw new Error(`Missing type of ${name} in snippet params`);
    }

    const valid = ["string", "number", "boolean"].includes(type);
    if (!valid) {
      throw new Error(
        `The ${type} type is not supported of ${name} in snippet params`
      );
    }

    const actualType = inputParams[name];
    if (actualType !== undefined && typeof actualType !== type) {
      throw new Error(
        `The ${name} is declared as type ${type}, but it is receiving a value of type ${typeof actualType}`
      );
    }
  });
}

function scanSnippetInStoryboard(data: unknown): string[] {
  const collection = new Set<string>();
  const beforeVisitGlobal = beforeVisitSnippetParamsFactory(collection);
  visitStoryboardExpressions(data, beforeVisitGlobal, {
    matchExpressionString: (v) => v.includes("SNIPPET_PARAMS"),
    customIsEvaluable: isSnippetEvaluation,
  });

  return Array.from(collection);
}

function computeRealSnippetConf(
  value: unknown,
  context: SnippetContext
): unknown {
  if (typeof value === "string" && isSnippetEvaluation(value)) {
    try {
      const raw: string = value;
      const ctxOrState = context.rootType === "template" ? "STATE" : "CTX";

      if (/^\s*<%@\s/.test(value)) {
        const replacements = [
          { search: "<%@", replace: "<%" },
          { search: /\bCTX_OR_STATE\b/g, replace: ctxOrState },
        ];

        let result = value;

        replacements.forEach((replacement) => {
          result = result.replace(replacement.search, replacement.replace);
        });

        return result;
      }

      const globalVariables: Record<string, unknown> = {};

      const { expression, attemptToVisitGlobals, source } = preevaluate(raw);

      const attemptVisitSnippetParams =
        attemptToVisitGlobals.has("SNIPPET_PARAMS");

      if (attemptVisitSnippetParams) {
        globalVariables.SNIPPET_PARAMS = context.inputParams;
      }

      const result = cook(expression, source, {
        globalVariables: supply(attemptToVisitGlobals, globalVariables),
      });

      return result;
    } catch (error) {
      /* istanbul ignore next */
      // eslint-disable-next-line no-console
      console.error("Parse storyboard expression failed:", error);
    }
  }

  if (!isObject(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => computeRealSnippetConf(v, context));
  }

  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [
      computeRealSnippetConf(k, context),
      computeRealSnippetConf(v, context),
    ])
  );
}
export function snippetEvaluate(
  brickConf: RuntimeSnippet,
  context: SnippetContext
): unknown {
  const collection = scanSnippetInStoryboard(brickConf);
  checkParamsValid(collection, context);

  const result = computeRealSnippetConf(brickConf, context);

  return result;
}
