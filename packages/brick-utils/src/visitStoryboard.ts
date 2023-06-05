import { StoryboardFunction } from "@next-core/brick-types";
import {
  precookFunction,
  PrecookHooks,
  isEvaluable,
  isSnippetEvaluation,
  preevaluate,
} from "./cook";
import { isObject } from "./isObject";

export function visitStoryboardFunctions(
  functions: StoryboardFunction[],
  beforeVisitGlobal: PrecookHooks["beforeVisitGlobal"]
): void {
  if (Array.isArray(functions)) {
    for (const fn of functions) {
      try {
        precookFunction(fn.source, {
          typescript: fn.typescript,
          withParent: true,
          hooks: { beforeVisitGlobal },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Parse storyboard function "${fn.name}" failed:`, error);
      }
    }
  }
}

interface VisitStoryboardExpressionsOptions {
  matchExpressionString: (v: string) => boolean;
  visitNonExpressionString?: (v: string) => unknown;
  visitObject?: (v: unknown[] | Record<string, unknown>) => unknown;
  customIsEvaluable?: (v: string) => boolean;
}

export function visitStoryboardExpressions(
  data: unknown,
  beforeVisitGlobal: PrecookHooks["beforeVisitGlobal"],
  // If `options` is a string, it means the *keyword*.
  options: string | VisitStoryboardExpressionsOptions
): void {
  const memo = new WeakSet();
  const {
    matchExpressionString,
    visitNonExpressionString,
    visitObject,
    customIsEvaluable = isEvaluable,
  } = typeof options === "string"
    ? ({
        matchExpressionString: (v: string) => v.includes(options),
      } as VisitStoryboardExpressionsOptions)
    : options;

  function visit(value: unknown): void {
    if (typeof value === "string") {
      if (matchExpressionString(value) && customIsEvaluable(value)) {
        try {
          preevaluate(value, {
            withParent: true,
            hooks: { beforeVisitGlobal },
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Parse storyboard expression failed:", error);
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
        visit(item);
      }
    }
  }
  visit(data);
}
