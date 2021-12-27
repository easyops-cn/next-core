import { StoryboardFunction } from "@next-core/brick-types";
import {
  precookFunction,
  PrecookHooks,
  isEvaluable,
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

export function visitStoryboardExpressions(
  data: unknown,
  beforeVisitGlobal: PrecookHooks["beforeVisitGlobal"],
  keyword: string
): void {
  const memo = new WeakSet();
  function visit(value: unknown): void {
    if (typeof value === "string") {
      if (value.includes(keyword) && isEvaluable(value)) {
        try {
          preevaluate(value, {
            withParent: true,
            hooks: { beforeVisitGlobal },
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Parse storyboard expression failed:", error);
        }
      }
    } else if (isObject(value)) {
      // Avoid call stack overflow.
      if (memo.has(value)) {
        return;
      }
      memo.add(value);
      for (const item of Array.isArray(value) ? value : Object.values(value)) {
        visit(item);
      }
    }
  }
  visit(data);
}
