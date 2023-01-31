import { StoryboardFunction } from "@next-core/brick-types";
import { precookFunction, PrecookHooks } from "@next-core/cook";

export function traverseStoryboardFunctions(
  functions: StoryboardFunction[] | null | undefined,
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
