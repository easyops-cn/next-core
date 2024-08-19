import type { MicroApp, StoryboardFunction } from "@next-core/types";
import {
  cook,
  precookFunction,
  EstreeNode,
  __dev_only_clearGlobalExecutionContextStack,
  __dev_only_getGlobalExecutionContextStack,
} from "@next-core/cook";
import { supply } from "@next-core/supply";
import { collectMemberUsageInFunction } from "@next-core/utils/storyboard";
import type _ from "lodash";
import { getGeneralGlobals } from "./internal/compute/getGeneralGlobals.js";

/** @internal */
export type ReadonlyStoryboardFunctions = Readonly<Record<string, Function>>;

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
    functions: StoryboardFunction[] | undefined,
    app?: PartialMicroApp
  ): void;

  /** Update a storyboard function during debugging. */
  updateStoryboardFunction(name: string, data: StoryboardFunctionPatch): void;

  checkPermissionsUsage(functionNames: string[]): boolean;

  clearGlobalExecutionContextStack(): void;
  getGlobalExecutionContextStack(): ReturnType<
    typeof __dev_only_getGlobalExecutionContextStack
  >;
}

/** @internal */
export interface RuntimeStoryboardFunction {
  source: string;
  typescript?: boolean;
  processed?: boolean;
  cooked?: Function;
  deps: Set<string> | string[];
  hasPermissionsCheck: boolean;
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
export type PartialMicroApp = Pick<MicroApp, "id" | "isBuildPush">;

/** @internal */
export function StoryboardFunctionRegistryFactory({
  widgetId,
  widgetVersion,
  collectCoverage,
  debuggerOverrides,
}: {
  widgetId?: string;
  widgetVersion?: string;
  collectCoverage?: FunctionCoverageSettings;
  debuggerOverrides?: (ctx: {
    precookFunction: typeof precookFunction;
    cook: typeof cook;
    supply: typeof supply;
  }) => {
    LodashWithStaticFields?: Partial<typeof _>;
    ArrayConstructor?: typeof Array;
    ObjectWithStaticFields?: Partial<typeof Object>;
  };
} = {}): StoryboardFunctionRegistry {
  const registeredFunctions = new Map<string, RuntimeStoryboardFunction>();

  const overrides = debuggerOverrides?.({
    precookFunction,
    cook,
    supply,
  });

  // Use `Proxy` with a frozen target, to make a readonly function registry.
  const storyboardFunctions = new Proxy(Object.freeze({}), {
    get(_target, key) {
      return getStoryboardFunction(key as string);
    },
  }) as ReadonlyStoryboardFunctions;

  let currentApp: PartialMicroApp | undefined;

  function registerStoryboardFunctions(
    functions: StoryboardFunction[],
    app?: PartialMicroApp
  ): void {
    if (app) {
      currentApp = app;
    }
    registeredFunctions.clear();
    if (Array.isArray(functions)) {
      for (const fn of functions) {
        let deps: Set<string> | string[] | undefined = fn.deps;
        if (deps == null) {
          deps = collectMemberUsageInFunction(fn, "FN", !!collectCoverage);
          (deps as Set<string>).delete(fn.name);
        }
        const hasPermissionsCheck =
          fn.perm ??
          collectMemberUsageInFunction(
            fn,
            "PERMISSIONS",
            !!collectCoverage
          ).has("check");
        registeredFunctions.set(fn.name, {
          source: fn.source,
          typescript: fn.typescript,
          deps,
          hasPermissionsCheck,
        });
      }
    }
  }

  function getStoryboardFunction(name: string): Function | undefined {
    const fn = registeredFunctions.get(name);
    if (!fn) {
      return undefined;
    }
    if (fn.processed) {
      return fn.cooked;
    }
    let collector: FunctionCoverageCollector | undefined;
    if (collectCoverage) {
      collector = collectCoverage.createCollector(name);
    }
    const precooked = precookFunction(fn.source, {
      typescript: fn.typescript,
      hooks: collector && {
        beforeVisit: collector.beforeVisit,
      },
      cacheKey: fn,
    });
    const globalVariables = supply(
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
    );

    fn.cooked = cook(precooked.function, fn.source, {
      rules: {
        noVar: true,
      },
      globalVariables: overrides
        ? {
            ...globalVariables,
            ...(overrides?.LodashWithStaticFields &&
            precooked.attemptToVisitGlobals.has("_")
              ? {
                  _: {
                    ...(globalVariables._ as typeof _),
                    ...overrides.LodashWithStaticFields,
                  },
                }
              : null),
            ...(overrides?.ArrayConstructor &&
            precooked.attemptToVisitGlobals.has("Array")
              ? {
                  Array: overrides.ArrayConstructor,
                }
              : null),
            ...(overrides?.ObjectWithStaticFields &&
            precooked.attemptToVisitGlobals.has("Object")
              ? {
                  Object: {
                    ...(globalVariables.Object as typeof Object),
                    ...overrides.ObjectWithStaticFields,
                  },
                }
              : null),
          }
        : globalVariables,
      ArrayConstructor: overrides?.ArrayConstructor,
      hooks: collector && {
        beforeEvaluate: collector.beforeEvaluate,
        beforeCall: collector.beforeCall,
        beforeBranch: collector.beforeBranch,
      },
      debug: !!debuggerOverrides,
    }) as Function;
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
      const newFn = {
        ...data,
        name,
      };
      const deps = collectMemberUsageInFunction(newFn, "FN", true);
      const hasPermissionsCheck = collectMemberUsageInFunction(
        newFn,
        "PERMISSIONS",
        true
      ).has("check");
      registeredFunctions.set(name, {
        source: data.source,
        typescript: data.typescript,
        deps,
        hasPermissionsCheck,
      });
    },
    /**
     * Check whether listed functions attempt to call `PERMISSIONS.check()`,
     * includes in nested `FN.*()` calls.
     */
    checkPermissionsUsage(functionNames) {
      const checkedFunctions = new Set<string>();
      const hasPermissionsCheck = (name: string): boolean => {
        if (!checkedFunctions.has(name)) {
          checkedFunctions.add(name);
          const fn = registeredFunctions.get(name);
          return (
            !!fn &&
            (fn.hasPermissionsCheck || [...fn.deps].some(hasPermissionsCheck))
          );
        }
        return false;
      };
      return functionNames.some(hasPermissionsCheck);
    },
    clearGlobalExecutionContextStack() {
      __dev_only_clearGlobalExecutionContextStack();
    },
    getGlobalExecutionContextStack() {
      return __dev_only_getGlobalExecutionContextStack();
    },
  };
}
