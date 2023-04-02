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
import { getBrickPackages, getRuntime } from "../Runtime.js";
import type { DataStore } from "../data/DataStore.js";
import { getTplStateStore } from "../CustomTemplates/utils.js";
import { widgetFunctions } from "./WidgetFunctions.js";
import {
  collectAppGetMenuUsage,
  collectInstalledAppsHasUsage,
  MemberCallUsage,
} from "./collectMemberCallUsage.js";
import { fetchMenuById, getMenuById } from "../menu/fetchMenuById.js";
import { widgetI18nFactory } from "./WidgetI18n.js";
import { widgetImagesFactory } from "./images.js";
import { hasInstalledApp, waitForCheckingApps } from "../checkInstalledApps.js";
import { isStrictMode, warnAboutStrictMode } from "../../isStrictMode.js";

const symbolForRaw = Symbol.for("pre.evaluated.raw");
const symbolForContext = Symbol.for("pre.evaluated.context");

export interface PreEvaluated {
  [symbolForRaw]: string;
  [symbolForContext]: RuntimeContext;
}

export interface EvaluateOptions {
  lazy?: boolean;
  isReEvaluation?: boolean;
  evaluationId?: number;
}

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
  runtimeContext: RuntimeContext,
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
  runtimeContext: RuntimeContext,
  options?: EvaluateOptions
): Promise<unknown> {
  const { run } = lowLevelEvaluate(raw, runtimeContext, options, false);
  return run();
}

function lowLevelEvaluate(
  raw: string | PreEvaluated, // string or pre-evaluated object.
  runtimeContext: RuntimeContext,
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

  // Collect `APP.getMenu(...)` usage before evaluating.
  const menuUsage: MemberCallUsage = {
    usedArgs: new Set(),
  };
  const hasAppUsage: MemberCallUsage = {
    usedArgs: new Set(),
  };

  // A `SyntaxError` maybe thrown.
  let precooked: PreevaluateResult;
  try {
    precooked = preevaluate(raw, {
      withParent: true,
      hooks: {
        beforeVisitGlobal(node, parent) {
          collectAppGetMenuUsage(menuUsage, node, parent!);
          collectInstalledAppsHasUsage(hasAppUsage, node, parent!);
        },
      },
    });
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

  if (menuUsage.hasNonStaticUsage) {
    throw new Error(
      `Non-static usage of "APP.getMenu" is prohibited in v3, check your expression: "${raw}"`
    );
  }

  if (hasAppUsage.hasNonStaticUsage) {
    throw new Error(
      `Non-static usage of "INSTALLED_APPS.has" is prohibited in v3, check your expression: "${raw}"`
    );
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
  const strict = isStrictMode(runtimeContext);

  // For existed TPL usage, treat it as a STATE.
  if (
    attemptToVisitGlobals.has("STATE") ||
    (!strict && attemptToVisitGlobals.has("TPL"))
  ) {
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
      // istanbul ignore if
      if (!strict) {
        const usedTpls = strictCollectMemberUsage(raw, "TPL");
        for (const tpl of usedTpls) {
          usedStates.add(tpl);
        }
      }
      isAsync && blockingList.push(tplStateStore.waitFor(usedStates));
    }

    if (attemptToVisitGlobals.has("PROCESSORS")) {
      usedProcessors = strictCollectMemberUsage(raw, "PROCESSORS", 2);
      isAsync &&
        blockingList.push(
          loadProcessorsImperatively(usedProcessors, getBrickPackages())
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

    if (menuUsage.usedArgs.size > 0) {
      // Block evaluating if has `APP.getMenu(...)` usage.
      const usedMenuIds = [...menuUsage.usedArgs];
      blockingList.push(
        Promise.all(
          usedMenuIds.map((menuId) => fetchMenuById(menuId, runtimeContext))
        )
      );
    }

    if (hasAppUsage.usedArgs.size > 0) {
      // Only wait for specific apps
      blockingList.push(waitForCheckingApps([...hasAppUsage.usedArgs]));
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
            globalVariables[variableName] = {
              ...cloneDeep(app),
              getMenu: getMenuById,
            };
            break;
          case "CTX":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
              get(target, key) {
                return ctxStore.getValue(key as string);
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
          case "INSTALLED_APPS":
            globalVariables[variableName] = getReadOnlyProxy({
              has: hasInstalledApp,
            });
            break;
          case "ITEM":
            if (!hasOwnProperty(runtimeContext, "forEachItem")) {
              // eslint-disable-next-line no-console
              console.error(
                `Using \`ITEM\` but no \`:forEach\` is found, check your expression: "${raw}"`
              );
            } else {
              globalVariables[variableName] = runtimeContext.forEachItem;
            }
            break;
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
            globalVariables[variableName] = getReadOnlyProxy(
              match?.params ?? {}
            );
            break;
          case "PATH_NAME":
            globalVariables[variableName] = location.pathname;
            break;
          case "PROCESSORS":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
              get(target, key) {
                const pkg = customProcessors.get(key as string);
                if (!pkg) {
                  throw new Error(
                    `'PROCESSORS.${
                      key as string
                    }' is not registered! Have you installed the relevant brick package?`
                  );
                }
                return getDynamicReadOnlyProxy({
                  get(t, k) {
                    return pkg.get(k as string);
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
          // istanbul ignore next
          case "TPL":
            warnAboutStrictMode(
              strict,
              'Using "TPL" in expression',
              `check your expression: "${raw}"`
            );
            if (strict) {
              break;
            }
          // eslint-disable-next-line no-fallthrough
          case "STATE":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
              get(target, key) {
                return tplStateStore!.getValue(key as string);
              },
              ownKeys() {
                return Array.from(usedStates);
              },
            });
            break;
          case "SYS":
            globalVariables[variableName] = getReadOnlyProxy(sys ?? {});
            break;
          case "__WIDGET_FN__":
            globalVariables[variableName] = widgetFunctions;
            break;
          case "__WIDGET_IMG__":
            globalVariables[variableName] = widgetImagesFactory;
            break;
          case "__WIDGET_I18N__":
            globalVariables[variableName] = widgetI18nFactory;
            break;
        }
      }

      Object.assign(
        globalVariables,
        getGeneralGlobals(precooked.attemptToVisitGlobals, {
          storyboardFunctions,
          app: runtimeContext.app,
          appendI18nNamespace: runtimeContext.appendI18nNamespace,
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
