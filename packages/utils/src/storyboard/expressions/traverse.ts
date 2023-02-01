import { Identifier } from "@babel/types";
import { isEvaluable, preevaluate, type EstreeParent } from "@next-core/cook";
import { isObject } from "@next-core/utils/general";

export interface TraverseStoryboardExpressionsOptions {
  matchExpressionString: (v: string) => boolean;
  visitNotMatchedExpressionString?: (v: string) => unknown;
  visitNonExpressionString?: (v: string) => unknown;
  visitObject?: (v: unknown[] | Record<string, unknown>) => unknown;
}

export type BeforeVisitGlobalWithExpr = (
  node: Identifier,
  parent: EstreeParent,
  expr: string
) => void;

export function traverseStoryboardExpressions(
  data: unknown,
  beforeVisitGlobal: BeforeVisitGlobalWithExpr,
  // If `options` is a string, it means the *keyword*.
  options: string | TraverseStoryboardExpressionsOptions
): void {
  const memo = new WeakSet();
  const {
    matchExpressionString,
    visitNotMatchedExpressionString,
    visitNonExpressionString,
    visitObject,
  } =
    typeof options === "string"
      ? ({
          matchExpressionString: (v: string) => v.includes(options),
        } as TraverseStoryboardExpressionsOptions)
      : options;
  function traverse(value: unknown): void {
    if (typeof value === "string") {
      if (isEvaluable(value)) {
        if (matchExpressionString(value)) {
          try {
            preevaluate(value, {
              withParent: true,
              hooks: {
                beforeVisitGlobal(node, parent) {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  beforeVisitGlobal(node, parent!, value);
                },
              },
            });
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Parse storyboard expression failed:", error);
          }
        } else {
          visitNotMatchedExpressionString?.(value);
        }
      } else {
        visitNonExpressionString?.(value);
      }
    } else if (isObject(value)) {
      // Avoid call stack overflow.
      if (memo.has(value)) {
        return;
      }
      memo.add(value);
      visitObject?.(value);
      for (const item of Array.isArray(value) ? value : Object.values(value)) {
        traverse(item);
      }
    }
  }
  traverse(data);
}
