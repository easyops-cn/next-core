import {
  MicroApp,
  SimpleFunction,
  StoryboardFunction,
} from "@next-core/brick-types";
import { cook, precookFunction, EstreeNode } from "@next-core/brick-utils";
import { supply } from "@next-core/supply";
import { getGeneralGlobals } from "../internal/getGeneralGlobals";

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
  registerStoryboardFunctions(
    functions: StoryboardFunction[],
    app?: PartialMicroApp
  ): void;

  /** Update a storyboard function during debugging. */
  updateStoryboardFunction(name: string, data: StoryboardFunctionPatch): void;
}

/** @internal */
export interface RuntimeStoryboardFunction {
  source: string;
  typescript?: boolean;
  processed?: boolean;
  cooked?: SimpleFunction;
}

/** @internal */
export interface FunctionCoverageCollector {
  beforeVisit(node: EstreeNode): void;
  beforeEvaluate(node: EstreeNode): void;
  beforeCall(node: EstreeNode): void;
  beforeBranch(node: EstreeNode, branch: string): void;
}

/** @internal */
export interface FunctionCoverageSettings {
  createCollector(name: string): FunctionCoverageCollector;
}

/** @internal */
export type PartialMicroApp = Pick<
  MicroApp,
  "id" | "isBuildPush" | "currentVersion" | "config"
>;

interface AppConfigSettings {
  perfStoryboardFunctions?: boolean;
}

/** @internal */
export function StoryboardFunctionRegistryFactory({
  widgetId,
  widgetVersion,
  collectCoverage,
}: {
  widgetId?: string;
  widgetVersion?: string;
  collectCoverage?: FunctionCoverageSettings;
} = {}): StoryboardFunctionRegistry {
  const registeredFunctions = new Map<string, RuntimeStoryboardFunction>();

  // Use `Proxy` with a frozen target, to make a readonly function registry.
  const storyboardFunctions = new Proxy(Object.freeze({}), {
    get(target, key) {
      return getStoryboardFunction(key as string);
    },
  }) as ReadonlyStoryboardFunctions;

  let currentApp: PartialMicroApp;
  let needPerf = false;

  function registerStoryboardFunctions(
    functions: StoryboardFunction[],
    app?: PartialMicroApp
  ): void {
    if (app) {
      currentApp = app;
      needPerf = (app?.config?.settings as AppConfigSettings)
        ?.perfStoryboardFunctions;
      if (needPerf) {
        // Clear perf data when initialize functions.
        window.STORYBOARD_FUNCTIONS_PERF = [];
      }
    }
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

  function getStoryboardFunction(name: string): SimpleFunction {
    const fn = registeredFunctions.get(name);
    if (!fn) {
      return undefined;
    }
    if (fn.processed) {
      return fn.cooked;
    }
    let collector: FunctionCoverageCollector;
    if (collectCoverage) {
      collector = collectCoverage.createCollector(name);
    }
    const precooked = precookFunction(fn.source, {
      cacheKey: fn,
      typescript: fn.typescript,
      hooks: collector && {
        beforeVisit: collector.beforeVisit,
      },
    });
    fn.cooked = cook(precooked.function, fn.source, {
      rules: {
        noVar: true,
      },
      globalVariables: supply(
        precooked.attemptToVisitGlobals,
        getGeneralGlobals(precooked.attemptToVisitGlobals, {
          collectCoverage,
          widgetId,
          widgetVersion,
          app: currentApp,
          storyboardFunctions,
          isStoryboardFunction: true,
        }),
        !!collectCoverage
      ),
      hooks: {
        perfCall: needPerf
          ? (duration) => {
              perf(name, fn.source, duration);
            }
          : undefined,
        ...(collector
          ? {
              beforeEvaluate: collector.beforeEvaluate,
              beforeCall: collector.beforeCall,
              beforeBranch: collector.beforeBranch,
            }
          : null),
      },
    }) as SimpleFunction;
    fn.processed = true;
    return fn.cooked;
  }

  return {
    storyboardFunctions,
    registerStoryboardFunctions,
    updateStoryboardFunction(
      name: string,
      data: StoryboardFunctionPatch
    ): void {
      registeredFunctions.set(name, {
        source: data.source,
        typescript: data.typescript,
      });
    },
  };
}

function perf(name: string, source: string, duration: number): void {
  const list = (window.STORYBOARD_FUNCTIONS_PERF ??= []);
  let data = list.find((item) => item.name === name);
  if (!data) {
    list.push((data = { name, durations: [], source }));
  }
  data.durations.push(Math.round(duration * 1000));
}
