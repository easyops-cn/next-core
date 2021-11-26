import { getFixedT } from "i18next";
import { identity } from "lodash";
import {
  MicroApp,
  SimpleFunction,
  StoryboardFunction,
} from "@next-core/brick-types";
import { cook, precookFunction, EstreeNode } from "@next-core/brick-utils";
import { supply } from "@next-core/supply";
import { i18nText } from "../i18nText";
import { getI18nNamespace } from "../i18n";
import {
  ImagesFactory,
  imagesFactory,
  widgetImagesFactory,
} from "../internal/images";
import { widgetI18nFactory } from "./WidgetI18n";

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
export type PartialMicroApp = Pick<MicroApp, "id" | "isBuildPush">;

/** @internal */
export function StoryboardFunctionRegistryFactory({
  widgetId,
  collectCoverage,
}: {
  widgetId?: string;
  collectCoverage?: FunctionCoverageSettings;
} = {}): StoryboardFunctionRegistry {
  const registeredFunctions = new Map<string, RuntimeStoryboardFunction>();

  // Use `Proxy` with a frozen target, to make a readonly function registry.
  const storyboardFunctions = new Proxy(Object.freeze({}), {
    get(target, key) {
      return getStoryboardFunction(key as string);
    },
  }) as ReadonlyStoryboardFunctions;

  const builtinSupply: Record<string, unknown> = {
    // Functions can call other functions.
    FN: storyboardFunctions,
    ...(collectCoverage
      ? {
          // Fake builtin methods for tests.
          I18N: identity,
          I18N_TEXT: fakeI18nText,
          IMG: fakeImageFactory(),
        }
      : widgetId
      ? {
          I18N: widgetI18nFactory(widgetId),
          I18N_TEXT: i18nText,
          IMG: widgetImagesFactory(widgetId),
        }
      : {
          I18N_TEXT: i18nText,
        }),
  };

  function registerStoryboardFunctions(
    functions: StoryboardFunction[],
    app?: PartialMicroApp
  ): void {
    if (app) {
      Object.assign(builtinSupply, {
        I18N: getFixedT(null, getI18nNamespace("app", app.id)),
        IMG: imagesFactory(app.id, app.isBuildPush),
      });
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
      typescript: fn.typescript,
      hooks: collector && {
        beforeVisit: collector.beforeVisit,
      },
    });
    fn.cooked = cook(precooked.function, fn.source, {
      rules: {
        noVar: true,
      },
      globalVariables: supply(precooked.attemptToVisitGlobals, builtinSupply),
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

function fakeImageFactory(): ImagesFactory {
  return {
    get(name: string) {
      return `mock/images/${name}`;
    },
  };
}
