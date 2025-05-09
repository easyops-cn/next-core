import {
  cook,
  preevaluate,
  PreevaluateResult,
  shouldAllowRecursiveEvaluations,
} from "@next-core/cook";
import { loadProcessorsImperatively } from "@next-core/loader";
import { supply } from "@next-core/supply";
import { hasOwnProperty } from "@next-core/utils/general";
import {
  strictCollectMemberUsage,
  collectAppGetMenuUsage,
  collectInstalledAppsHasUsage,
  MemberCallUsage,
} from "@next-core/utils/storyboard";
import { cloneDeep, omit } from "lodash";
import type { RuntimeContext } from "../interfaces.js";
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
import { devtoolsHookEmit, getDevHook } from "../devtools.js";
import { getMedia } from "../mediaQuery.js";
import { getStorageItem } from "./getStorageItem.js";
import {
  _internalApiGetRuntimeContext,
  _internalApiGetStoryboardInBootstrapData,
  getBrickPackages,
  getRuntime,
  hooks,
} from "../Runtime.js";
import type { DataStore } from "../data/DataStore.js";
import { getTplStateStore } from "../CustomTemplates/utils.js";
import { widgetFunctions } from "./WidgetFunctions.js";
import { widgetI18nFactory } from "./WidgetI18n.js";
import { hasInstalledApp } from "../hasInstalledApp.js";
import { isStrictMode, warnAboutStrictMode } from "../../isStrictMode.js";
import { getFormStateStore } from "../FormRenderer/utils.js";
import { resolveData } from "../data/resolveData.js";
import { asyncComputeRealValue } from "./computeRealValue.js";

const symbolForRaw = Symbol.for("pre.evaluated.raw");
const symbolForContext = Symbol.for("pre.evaluated.context");

export interface PreEvaluated {
  [symbolForRaw]: string;
  [symbolForContext]: RuntimeContext;
}

export interface EvaluateOptions {
  lazy?: boolean;
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

    const passByRuntimeContext = omit(runtimeContext, [
      "pendingPermissionsPreCheck",
      "tplStateStoreMap",
      "tplStateStoreScope",
      "formStateStoreMap",
      "formStateStoreScope",
    ]);

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
      cache: true,
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
    const errorConstructor = getCookErrorConstructor(error);
    throw new errorConstructor(message);
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

  let usedCtx: Set<string> | undefined;
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

  let usedFormStates: Set<string>;
  let formStateStore: DataStore<"FORM_STATE"> | undefined;
  if (attemptToVisitGlobals.has("FORM_STATE")) {
    formStateStore = getFormStateStore(
      runtimeContext,
      "FORM_STATE",
      `: "${raw}"`
    );
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

    if (formStateStore) {
      usedFormStates = strictCollectMemberUsage(raw, "FORM_STATE");
      isAsync && blockingList.push(formStateStore.waitFor(usedFormStates));
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

    if (menuUsage.usedArgs.size > 0 && hooks?.menu) {
      // Block evaluating if has `APP.getMenu(...)` usage.
      const usedMenuIds = [...menuUsage.usedArgs];
      blockingList.push(
        Promise.all(
          usedMenuIds.map((menuId) =>
            hooks!.menu!.fetchMenuById(menuId, runtimeContext, {
              getStoryboardByAppId: _internalApiGetStoryboardInBootstrapData,
              resolveData,
              asyncComputeRealValue,
            })
          )
        )
      );
    }

    if (hasAppUsage.usedArgs.size > 0) {
      // Only wait for specific apps
      blockingList.push(
        hooks?.checkInstalledApps?.waitForCheckingApps([
          ...hasAppUsage.usedArgs,
        ])
      );
    }
  }

  return {
    blockingList,
    run() {
      const { ctxStore, data, event, unsafe_penetrate } = runtimeContext;

      const penetrableCtx = unsafe_penetrate
        ? _internalApiGetRuntimeContext()!
        : runtimeContext;

      const {
        app: currentApp,
        location,
        query,
        match,
        flags,
        sys,
      } = penetrableCtx;
      const app = penetrableCtx.overrideApp ?? currentApp;

      for (const variableName of attemptToVisitGlobals) {
        switch (variableName) {
          // case "ALIAS":
          case "ANCHOR":
            globalVariables[variableName] = location.hash
              ? location.hash.substring(1)
              : null;
            break;
          case "APP":
            if (app == null) {
              throw new ReferenceError(`APP is not defined, in "${raw}"`);
            }
            globalVariables[variableName] = {
              ...cloneDeep(app),
              getMenu: hooks?.menu?.getMenuById,
            };
            break;
          case "CTX":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
              get(_target, key) {
                // Allow accessing global `CTX.DS` from an isolated root such as dashboard.
                if (key === "DS" && !ctxStore.has(key)) {
                  const internalCtxStore =
                    _internalApiGetRuntimeContext()?.ctxStore;
                  if (internalCtxStore?.has(key)) {
                    return internalCtxStore.getValue(key);
                  }
                }
                return ctxStore.getValue(key as string);
              },
              ownKeys() {
                return usedCtx ? Array.from(usedCtx) : [];
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
          case "FORM_STATE":
            globalVariables[variableName] = getDynamicReadOnlyProxy({
              get(_target, key) {
                return formStateStore!.getValue(key as string);
              },
              ownKeys() {
                return Array.from(usedFormStates);
              },
            });
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
          case "INDEX":
          case "SIZE": {
            const property =
              variableName === "ITEM"
                ? "forEachItem"
                : variableName === "INDEX"
                  ? "forEachIndex"
                  : "forEachSize";
            if (!hasOwnProperty(runtimeContext, property)) {
              // eslint-disable-next-line no-console
              console.error(
                `Using \`${variableName}\` but no \`:forEach\` is found, check your expression: "${raw}"`
              );
            } else {
              globalVariables[variableName] = runtimeContext[property];
            }
            break;
          }
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
            if (query == null) {
              throw new ReferenceError(`PARAMS is not defined, in "${raw}"`);
            }
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
              get(_target, key) {
                const pkg = customProcessors.get(key as string);
                if (!pkg) {
                  throw new Error(
                    `'PROCESSORS.${
                      key as string
                    }' is not registered! Have you installed the relevant brick package?`
                  );
                }
                return getDynamicReadOnlyProxy({
                  get(_t, k) {
                    return pkg.get(k as string);
                  },
                  ownKeys() {
                    return Array.from(pkg.keys());
                  },
                });
              },
              ownKeys() {
                const keys = new Set<string>();
                for (const processor of usedProcessors) {
                  const namespace = processor.split(".")[0];
                  keys.add(namespace);
                }
                return Array.from(keys);
              },
            });
            break;
          case "QUERY":
            if (query == null) {
              throw new ReferenceError(`QUERY is not defined, in "${raw}"`);
            }
            globalVariables[variableName] = Object.fromEntries(
              Array.from(query.keys()).map((key) => [key, query.get(key)])
            );
            break;
          case "QUERY_ARRAY":
            if (query == null) {
              throw new ReferenceError(
                `QUERY_ARRAY is not defined, in "${raw}"`
              );
            }
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
              get(_target, key) {
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
            globalVariables[variableName] = hooks?.images?.widgetImagesFactory;
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
          app: app,
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
        const detail = { raw, context: globalVariables, result };
        devtoolsHookEmit("evaluation", detail);
        return result;
      } catch (error: any) {
        const message = `${error.message}, in "${raw}"`;
        const errorConstructor = getCookErrorConstructor(error);
        throw new errorConstructor(message);
      }
    },
  };
}
