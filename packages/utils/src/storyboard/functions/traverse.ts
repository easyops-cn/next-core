import type { StoryboardFunction } from "@next-core/types";
import { precookFunction } from "@next-core/cook";
import { BeforeVisitGlobal } from "../index.js";

export interface TraverseStoryboardFunctionsOptions {
  matchSource?: (source: string) => boolean;
}

export function traverseStoryboardFunctions(
  functions: StoryboardFunction[] | null | undefined,
  beforeVisitGlobal: BeforeVisitGlobal,
  options?: TraverseStoryboardFunctionsOptions
): void {
  if (Array.isArray(functions)) {
    for (const fn of functions) {
      if (!options?.matchSource || options.matchSource(fn.source)) {
        traverseStoryboardFunction(fn, beforeVisitGlobal);
      }
    }
  }
}

export function traverseStoryboardFunction(
  fn: StoryboardFunction,
  beforeVisitGlobal: BeforeVisitGlobal,
  silentErrors?: boolean
): void {
  try {
    precookFunction(fn.source, {
      typescript: fn.typescript,
      withParent: true,
      hooks: { beforeVisitGlobal },
      cacheKey: fn,
      cacheMode: "rw",
    });
  } catch (error) {
    if (!silentErrors) {
      // eslint-disable-next-line no-console
      console.error(`Parse storyboard function "${fn.name}" failed:`, error);
    }
  }
}
