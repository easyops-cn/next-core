import { StoryboardFunction } from "@next-core/brick-types";
import { precookFunction } from "@next-core/cook";
import { BeforeVisitGlobal } from "../index.js";

export function traverseStoryboardFunctions(
  functions: StoryboardFunction[] | null | undefined,
  beforeVisitGlobal: BeforeVisitGlobal
): void {
  if (Array.isArray(functions)) {
    for (const fn of functions) {
      traverseStoryboardFunction(fn, beforeVisitGlobal);
    }
  }
}

export function traverseStoryboardFunction(
  fn: StoryboardFunction,
  beforeVisitGlobal: BeforeVisitGlobal
): void {
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
