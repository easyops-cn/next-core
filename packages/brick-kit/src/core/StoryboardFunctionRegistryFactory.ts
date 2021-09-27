import {
  RuntimeStoryboardFunction,
  SimpleFunction,
  StoryboardFunction,
} from "@next-core/brick-types";
import { cook, precookFunction } from "@next-core/brick-utils";
import { supply } from "@next-core/supply";

/** @internal */
export type ReadonlyStoryboardFunctions = Readonly<
  Record<string, SimpleFunction>
>;

/** @internal */
export type StoryboardFunctionPatch = Pick<
  StoryboardFunction,
  "source" | "typescript"
>;

/** @internal */
export interface StoryboardFunctionRegistry {
  /** A readonly proxy for accessing cooked storyboard functions. */
  storyboardFunctions: ReadonlyStoryboardFunctions;

  /** Register storyboard functions. */
  registerStoryboardFunctions(functions: StoryboardFunction[]): void;

  /** Update a storyboard function during debugging. */
  updateStoryboardFunction(name: string, data: StoryboardFunctionPatch): void;
}

/** @internal */
export function StoryboardFunctionRegistryFactory(): StoryboardFunctionRegistry {
  const registeredFunctions = new Map<string, RuntimeStoryboardFunction>();

  // Use `Proxy` with a frozen target, to make a readonly function registry.
  const storyboardFunctions = new Proxy(Object.freeze({}), {
    get(target, key) {
      return getStoryboardFunction(key as string);
    },
  }) as ReadonlyStoryboardFunctions;

  function registerStoryboardFunctions(functions: StoryboardFunction[]): void {
    registeredFunctions.clear();
    if (Array.isArray(functions)) {
      for (const fn of functions) {
        registeredFunctions.set(fn.name, {
          source: fn.source,
          typescript: fn.typescript,
        });
      }
    }
  }

  function getStoryboardFunction(
    name: string
  ): (...args: unknown[]) => unknown {
    const fn = registeredFunctions.get(name);
    if (!fn) {
      return undefined;
    }
    if (!fn.processed) {
      const precooked = precookFunction(fn.source, {
        typescript: fn.typescript,
      });
      fn.cooked = cook(precooked.function, fn.source, {
        rules: {
          noVar: true,
        },
        globalVariables: supply(precooked.attemptToVisitGlobals, {
          // Functions can call other functions.
          FN: storyboardFunctions,
        }),
      }) as SimpleFunction;
      fn.processed = true;
    }
    return fn.cooked;
  }

  function updateStoryboardFunction(
    name: string,
    data: StoryboardFunctionPatch
  ): void {
    registeredFunctions.set(name, {
      source: data.source,
      typescript: data.typescript,
    });
  }

  return {
    storyboardFunctions,
    registerStoryboardFunctions,
    updateStoryboardFunction,
  };
}
