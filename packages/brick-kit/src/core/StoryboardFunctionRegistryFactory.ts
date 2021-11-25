import i18next from "i18next";
import { identity } from "lodash";
import { SimpleFunction, StoryboardFunction } from "@next-core/brick-types";
import { cook, precookFunction, EstreeNode } from "@next-core/brick-utils";
import { supply } from "@next-core/supply";
import { i18nText } from "../i18nText";
import { getI18nNamespace } from "../i18n";

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
    appId?: string
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
export function StoryboardFunctionRegistryFactory({
  widgetId,
  collectCoverage,
}: {
  widgetId?: string;
  collectCoverage?: FunctionCoverageSettings;
} = {}): StoryboardFunctionRegistry {
  const registeredFunctions = new Map<string, RuntimeStoryboardFunction>();
  let currentAppId: string;

  // Use `Proxy` with a frozen target, to make a readonly function registry.
  const storyboardFunctions = new Proxy(Object.freeze({}), {
    get(target, key) {
      return getStoryboardFunction(key as string);
    },
  }) as ReadonlyStoryboardFunctions;

  function registerStoryboardFunctions(
    functions: StoryboardFunction[],
    appId?: string
  ): void {
    registeredFunctions.clear();
    currentAppId = appId;
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
      typescript: fn.typescript,
      hooks: collector && {
        beforeVisit: collector.beforeVisit,
      },
    });
    fn.cooked = cook(precooked.function, fn.source, {
      rules: {
        noVar: true,
      },
      globalVariables: supply(precooked.attemptToVisitGlobals, {
        // Functions can call other functions.
        FN: storyboardFunctions,
        // Functions can call i18n methods.
        I18N: collectCoverage
          ? identity // Return the key directly for tests.
          : widgetId
          ? i18next.getFixedT(null, getI18nNamespace("widget", widgetId))
          : currentAppId
          ? i18next.getFixedT(null, getI18nNamespace("app", currentAppId))
          : undefined,
        I18N_TEXT: collectCoverage
          ? fakeI18nText // Return `en` directly for tests.
          : i18nText,
      }),
      hooks: collector && {
        beforeEvaluate: collector.beforeEvaluate,
        beforeCall: collector.beforeCall,
        beforeBranch: collector.beforeBranch,
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

function fakeI18nText(data: Record<string, string>): string {
  return data?.en;
}
