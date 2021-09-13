import {
  RuntimeStoryboard,
  RuntimeStoryboardFunction,
  SimpleFunction,
} from "@next-core/brick-types";
import { cook, precookFunction, supply } from "@next-core/brick-utils";

const registeredFunctions = new Map<string, RuntimeStoryboardFunction>();

type ReadonlyStoryboardFunctions = Readonly<Record<string, SimpleFunction>>;

// Use `Proxy` with a frozen target, to make a readonly function registry.
const storyboardFunctions = new Proxy(Object.freeze({}), {
  get(target, key) {
    return getStoryboardFunction(key as string);
  },
}) as ReadonlyStoryboardFunctions;

export function registerStoryboardFunctions(
  storyboard: RuntimeStoryboard
): void {
  registeredFunctions.clear();
  if (Array.isArray(storyboard.meta?.functions)) {
    for (const fn of storyboard.meta.functions) {
      registeredFunctions.set(fn.name, {
        source: fn.source,
        typescript: fn.typescript,
      });
    }
  }
}

export function getStoryboardFunctions(): ReadonlyStoryboardFunctions {
  return storyboardFunctions;
}

function getStoryboardFunction(name: string): (...args: unknown[]) => unknown {
  const fn = registeredFunctions.get(name);
  if (!fn) {
    throw new ReferenceError(`Function not found: ${name}`);
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
