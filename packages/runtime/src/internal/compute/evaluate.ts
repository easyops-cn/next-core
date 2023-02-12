import {
  cook,
  preevaluate,
  PreevaluateResult,
  shouldAllowRecursiveEvaluations,
} from "@next-core/cook";
import { loadProcessorsImperatively } from "@next-core/loader";
import { supply } from "@next-core/supply";
import { hasOwnProperty } from "@next-core/utils/general";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";
import type { RuntimeContext } from "../interfaces.js";
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
import type { DataStore } from "../data/DataStore.js";
import { getTplStateStore } from "../CustomTemplates/utils.js";

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

export function shouldDismissMarkingComputed(
  raw: string | PreEvaluated
): boolean {
  if (typeof raw === "string") {
    return shouldAllowRecursiveEvaluations(raw);
  }
  return shouldAllowRecursiveEvaluations(raw[symbolForRaw]);
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

    const {
      pendingPermissionsPreCheck: _1,
      tplStateStoreMap: _2,
      ...passByRuntimeContext
    } = runtimeContext;

    runtimeContext = {
      ...raw[symbolForContext],
      ...passByRuntimeContext,
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

  // Ignore evaluating if required `event/DATA` is missing in
  // context. Since they are are provided in different context, whenever
  // missing one of them, memorize the current context for later consuming.
  if (
    options.lazy ||
    (attemptToVisitGlobals.has("EVENT") &&
      !hasOwnProperty(runtimeContext, "event")) ||
    (attemptToVisitGlobals.has("DATA") &&
      !hasOwnProperty(runtimeContext, "data"))
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
  let usedStates: Set<string>;
  let tplStateStore: DataStore<"STATE"> | undefined;

  if (attemptToVisitGlobals.has("STATE")) {
    tplStateStore = getTplStateStore(runtimeContext, "STATE", `: "${raw}"`);
  }

  const devHook = getDevHook();
  if (isAsync || devHook) {
    if (attemptToVisitGlobals.has("CTX")) {
      usedCtx = strictCollectMemberUsage(raw, "CTX");
      isAsync && blockingList.push(runtimeContext.ctxStore.waitFor(usedCtx));
    }

    if (tplStateStore) {
      usedStates = strictCollectMemberUsage(raw, "STATE");
      isAsync && blockingList.push(tplStateStore.waitFor(usedStates));
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

      for (const variableName of attemptToVisitGlobals) {
        switch (variableName) {
          // case "ALIAS":
          case "ANCHOR":
            globalVariables[variableName] = location.hash
              ? location.hash.substring(1)
              : null;
            break;
          case "APP":
            globalVariables[variableName] = cloneDeep(app);
            break;
          case "CTX":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
              get(target, key: string) {
                return ctxStore.getValue(key);
              },
              ownKeys() {
                return Array.from(usedCtx);
              },
            });
            break;
          case "DATA":
            globalVariables[variableName] = data;
            break;
          case "EVENT":
            globalVariables[variableName] = event;
            break;
          case "FLAGS":
            globalVariables[variableName] = getReadOnlyProxy(flags);
            break;
          case "HASH":
            globalVariables[variableName] = location.hash;
            break;
          // case "INSTALLED_APPS":
          case "LOCAL_STORAGE":
            globalVariables[variableName] = getReadOnlyProxy({
              getItem: getStorageItem("local"),
            });
            break;
          case "MEDIA":
            globalVariables[variableName] = getReadOnlyProxy(getMedia());
            break;
          case "MISC":
            globalVariables[variableName] = getRuntime().getMiscSettings();
            break;
          case "PARAMS":
            globalVariables[variableName] = new URLSearchParams(query);
            break;
          case "PATH":
            globalVariables[variableName] = getReadOnlyProxy(match!.params);
            break;
          case "PATH_NAME":
            globalVariables[variableName] = location.pathname;
            break;
          case "PROCESSORS":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
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
            break;
          case "QUERY":
            globalVariables[variableName] = Object.fromEntries(
              Array.from(query.keys()).map((key) => [key, query.get(key)])
            );
            break;
          case "QUERY_ARRAY":
            globalVariables[variableName] = Object.fromEntries(
              Array.from(query.keys()).map((key) => [key, query.getAll(key)])
            );
            // case "SEGUE":
            break;
          case "SESSION_STORAGE":
            globalVariables[variableName] = getReadOnlyProxy({
              getItem: getStorageItem("session"),
            });
            break;
          case "STATE":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
              get(target, key: string) {
                return tplStateStore!.getValue(key);
              },
              ownKeys() {
                return Array.from(usedStates);
              },
            });
            break;
          case "SYS":
            globalVariables[variableName] = getReadOnlyProxy(sys);
          // case "__WIDGET_FN__":
          // case "__WIDGET_IMG__":
          // case "__WIDGET_I18N__":
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
