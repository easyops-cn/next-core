import type { StoryboardFunction } from "@next-core/types";
import {
  type ReadonlyStoryboardFunctions,
  StoryboardFunctionRegistryFactory,
} from "../../StoryboardFunctionRegistry.js";

export const isolatedFunctionRegistry = new Map<
  symbol,
  ReadonlyStoryboardFunctions
>();

export function registerIsolatedFunctions(
  isolatedRoot: symbol,
  functions: StoryboardFunction[] | undefined
): void {
  const { storyboardFunctions, registerStoryboardFunctions } =
    StoryboardFunctionRegistryFactory({ isolatedRoot });
  isolatedFunctionRegistry.set(isolatedRoot, storyboardFunctions);
  registerStoryboardFunctions(functions);
}
