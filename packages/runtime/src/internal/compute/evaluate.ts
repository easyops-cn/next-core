import { cook, preevaluate, PreevaluateResult } from "@next-core/cook";
import { loadProcessorsImperatively } from "@next-core/loader";
import { supply } from "@next-core/supply";
import { hasOwnProperty } from "@next-core/utils/general";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";
import { RuntimeContext } from "@next-core/brick-types";
import { cloneDeep } from "lodash";
import { customProcessors } from "../../CustomProcessors.js";
import {
  checkPermissionsUsage,
  storyboardFunctions,
} from "./StoryboardFunctions.js";
import { getGeneralGlobals } from "./getGeneralGlobals.js";
import {
  getDynamicReadOnlyProxy,
  getReadOnlyProxy,
} from "../proxyFactories.js";
import { getDevHook } from "../devtools.js";
import { getMedia } from "../mediaQuery.js";
import { getStorageItem } from "./getStorageItem.js";
import { getRuntime } from "../Runtime.js";

const symbolForRaw = Symbol.for("pre.evaluated.raw");
const symbolForContext = Symbol.for("pre.evaluated.context");

export interface PreEvaluated {
  [symbolForRaw]: string;
  [symbolForContext]: EvaluateRuntimeContext;
}

export interface EvaluateOptions {
  lazy?: boolean;
  isReEvaluation?: boolean;
  evaluationId?: number;
}

interface EvaluateRuntimeContext extends RuntimeContext {}

export function isPreEvaluated(raw: unknown): raw is PreEvaluated {
  return !!(raw as PreEvaluated)?.[symbolForRaw];
}

export function getPreEvaluatedRaw(pre: PreEvaluated): string {
  return pre[symbolForRaw];
}

const possibleErrorConstructs = new WeakSet<ErrorConstructor>([
  SyntaxError,
  TypeError,
  ReferenceError,
]);

export function getCookErrorConstructor(error: any): ErrorConstructor {
  return possibleErrorConstructs.has(error.constructor)
    ? error.constructor
    : TypeError;
}

export async function asyncEvaluate(
  raw: string | PreEvaluated, // string or pre-evaluated object.
  runtimeContext: EvaluateRuntimeContext,
  options?: EvaluateOptions
): Promise<unknown> {
  const { blockingList, run } = lowLevelEvaluate(
    raw,
    runtimeContext,
    options,
    true
  );
  await Promise.all(blockingList);
  return run();
}

export function evaluate(
  raw: string | PreEvaluated, // string or pre-evaluated object.
  runtimeContext: EvaluateRuntimeContext,
  options?: EvaluateOptions
): Promise<unknown> {
  const { run } = lowLevelEvaluate(raw, runtimeContext, options, false);
  return run();
}

function lowLevelEvaluate(
  raw: string | PreEvaluated, // string or pre-evaluated object.
  runtimeContext: EvaluateRuntimeContext,
  options: EvaluateOptions = {},
  isAsync?: boolean
): {
  blockingList: (Promise<unknown> | undefined)[];
  run: Function;
} {
  const blockingList: (Promise<unknown> | undefined)[] = [];
  if (typeof raw !== "string") {
    // If the `raw` is not a string, it must be a pre-evaluated object.
    // Then fulfil the context, and restore the original `raw`.
    runtimeContext = {
      ...raw[symbolForContext],
      ...runtimeContext,
    };
    raw = raw[symbolForRaw];
  }

  // A `SyntaxError` maybe thrown.
  let precooked: PreevaluateResult;
  try {
    precooked = preevaluate(raw);
  } catch (error: any) {
    const message = `${error.message}, in "${raw}"`;
    // if (options.isReEvaluation) {
    //   devtoolsHookEmit("re-evaluation", {
    //     id: options.evaluationId,
    //     detail: { raw, context: {} },
    //     error: message,
    //   });
    //   return;
    // } else {
    const errorConstructor = getCookErrorConstructor(error);
    throw new errorConstructor(message);
    // }
  }

  const globalVariables: Record<string, unknown> = {};
  const { attemptToVisitGlobals } = precooked;

  const attemptToVisitEvent = attemptToVisitGlobals.has("EVENT");
  const attemptToVisitData = attemptToVisitGlobals.has("DATA");
  const attemptToVisitState = attemptToVisitGlobals.has("STATE");
  const attemptToVisitFormState = attemptToVisitGlobals.has("FORM_STATE");

  // Ignore evaluating if required `event/DATA/STATE/FORM_STATE` is missing in
  // context. Since they are are provided in different context, whenever
  // missing one of them, memorize the current context for later consuming.
  if (
    (attemptToVisitEvent && !hasOwnProperty(runtimeContext, "event")) ||
    (attemptToVisitState && !hasOwnProperty(runtimeContext, "tplContextId")) ||
    (attemptToVisitData && !hasOwnProperty(runtimeContext, "data"))
  ) {
    return {
      blockingList,
      run() {
        return Object.keys(runtimeContext).length > 0
          ? ({
              [symbolForRaw]: raw,
              [symbolForContext]: runtimeContext,
            } as PreEvaluated)
          : raw;
      },
    };
  }

  let usedCtx: Set<string>;
  let usedProcessors: Set<string>;

  const devHook = getDevHook();
  if (isAsync || devHook) {
    if (attemptToVisitGlobals.has("CTX")) {
      usedCtx = strictCollectMemberUsage(raw, "CTX");
      isAsync && blockingList.push(runtimeContext.ctxStore.waitFor(usedCtx));
    }

    if (attemptToVisitGlobals.has("PROCESSORS")) {
      usedProcessors = strictCollectMemberUsage(raw, "PROCESSORS", 2);
      isAsync &&
        blockingList.push(
          loadProcessorsImperatively(
            usedProcessors,
            runtimeContext.brickPackages
          )
        );
    }
  }

  if (isAsync) {
    let attemptToCheckPermissions = attemptToVisitGlobals.has("PERMISSIONS");
    // There maybe `PERMISSIONS.check()` usage in functions
    if (!attemptToCheckPermissions && attemptToVisitGlobals.has("FN")) {
      const usedFunctions = [...strictCollectMemberUsage(raw, "FN")];
      attemptToCheckPermissions = checkPermissionsUsage(usedFunctions);
    }

    if (attemptToCheckPermissions) {
      blockingList.push(...runtimeContext.pendingPermissionsPreCheck);
    }
  }

  return {
    blockingList,
    run() {
      const {
        app: currentApp,
        location,
        query,
        match,
        flags,
        sys,
        ctxStore,
        data,
        event,
      } = runtimeContext;
      const app = runtimeContext.overrideApp ?? currentApp;

      const getIndividualGlobal = (variableName: string): unknown => {
        switch (variableName) {
          // case "ALIAS":
          case "ANCHOR":
            return location.hash ? location.hash.substring(1) : null;
          case "APP":
            return cloneDeep(app);
          case "CTX":
            return getDynamicReadOnlyProxy({
              get(target, key: string) {
                return ctxStore.getValue(key);
              },
              ownKeys() {
                return Array.from(usedCtx);
              },
            });
          case "DATA":
            return data;
          case "EVENT":
            return event;
          case "FLAGS":
            return getReadOnlyProxy(flags);
          case "HASH":
            return location.hash;
          // case "INSTALLED_APPS":
          case "LOCAL_STORAGE":
            return getReadOnlyProxy({
              getItem: getStorageItem("local"),
            });
          case "MEDIA":
            return getReadOnlyProxy(getMedia());
          case "MISC":
            return getRuntime().getMiscSettings();
          case "PARAMS":
            return new URLSearchParams(query);
          case "PATH":
            return getReadOnlyProxy(match!.params);
          case "PATH_NAME":
            return location.pathname;
          case "PROCESSORS":
            return getDynamicReadOnlyProxy({
              get(target, key: string) {
                const pkg = customProcessors.get(key);
                if (!pkg) {
                  throw new Error(
                    `'PROCESSORS.${key}' is not registered! Have you installed the relevant brick package?`
                  );
                }
                return getDynamicReadOnlyProxy({
                  get(t, k: string) {
                    return pkg.get(k);
                  },
                  ownKeys() {
                    return Array.from(pkg.keys());
                  },
                });
              },
              ownKeys() {
                return Array.from(usedProcessors);
              },
            });
          case "QUERY":
            return Object.fromEntries(
              Array.from(query.keys()).map((key) => [key, query.get(key)])
            );
          case "QUERY_ARRAY":
            return Object.fromEntries(
              Array.from(query.keys()).map((key) => [key, query.getAll(key)])
            );
          // case "SEGUE":
          case "SESSION_STORAGE":
            return getReadOnlyProxy({
              getItem: getStorageItem("session"),
            });
          case "SYS":
            return getReadOnlyProxy(sys);
          // case "__WIDGET_FN__":
          // case "__WIDGET_IMG__":
          // case "__WIDGET_I18N__":
        }
      };

      for (const variableName of attemptToVisitGlobals) {
        const variable = getIndividualGlobal(variableName);
        if (variable !== undefined) {
          globalVariables[variableName] = variable;
        }
      }

      Object.assign(
        globalVariables,
        getGeneralGlobals(precooked.attemptToVisitGlobals, {
          storyboardFunctions,
          app: runtimeContext.app,
          // appendI18nNamespace: runtimeContext.appendI18nNamespace,
        })
      );

      try {
        const result = cook(precooked.expression, precooked.source, {
          globalVariables: supply(
            precooked.attemptToVisitGlobals,
            globalVariables
          ),
        });
        // const detail = { raw, context: globalVariables, result };
        // if (options.isReEvaluation) {
        //   devtoolsHookEmit("re-evaluation", {
        //     id: options.evaluationId,
        //     detail,
        //   });
        // } else {
        //   devtoolsHookEmit("evaluation", detail);
        // }
        return result;
      } catch (error: any) {
        const message = `${error.message}, in "${raw}"`;
        // if (options.isReEvaluation) {
        //   devtoolsHookEmit("re-evaluation", {
        //     id: options.evaluationId,
        //     detail: { raw, context: globalVariables },
        //     error: message,
        //   });
        // } else {
        const errorConstructor = getCookErrorConstructor(error);
        throw new errorConstructor(message);
        // }
      }
    },
  };
}
