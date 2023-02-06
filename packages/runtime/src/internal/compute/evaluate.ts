import { cook, preevaluate, PreevaluateResult } from "@next-core/cook";
import { loadProcessorsImperatively } from "@next-core/loader";
import { supply } from "@next-core/supply";
import { hasOwnProperty } from "@next-core/utils/general";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";
import { RuntimeContext } from "@next-core/brick-types";
import { customProcessors } from "../../CustomProcessors.js";
import {
  checkPermissionsUsage,
  storyboardFunctions,
} from "./StoryboardFunctions.js";
import { getGeneralGlobals } from "./getGeneralGlobals.js";

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

export async function evaluate(
  ...args: Parameters<typeof lowLevelEvaluate>
): Promise<unknown> {
  const { blockingList, run } = lowLevelEvaluate(...args);
  await Promise.all(blockingList);
  return run();
}

export function syncEvaluate(
  ...args: Parameters<typeof lowLevelEvaluate>
): Promise<unknown> {
  const { run } = lowLevelEvaluate(...args);
  return run();
}

function lowLevelEvaluate(
  raw: string | PreEvaluated, // string or pre-evaluated object.
  runtimeContext: EvaluateRuntimeContext,
  options: EvaluateOptions = {}
): {
  blockingList: Promise<unknown>[];
  run: Function;
} {
  const blockingList: Promise<unknown>[] = [];
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

  // Ignore evaluating if `event` is missing in context.
  // Since it should be evaluated during events handling.
  let missingEvent = options.lazy === true;
  if (attemptToVisitEvent) {
    if (hasOwnProperty(runtimeContext, "event")) {
      globalVariables.EVENT = runtimeContext.event;
    } else {
      // Let's see if pre-evaluation is required (store the `data` in context).
      missingEvent = true;
    }
  }

  // Since `EVENT`, `DATA`, `STATE` and `FORM_STATE` are provided in different context,
  // whenever missing one of them, memorize the current context for later consuming.
  if (
    missingEvent ||
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

  if (attemptToVisitData) {
    globalVariables.DATA = runtimeContext.data;
  }

  if (attemptToVisitGlobals.has("PROCESSORS")) {
    const loadProcessors = async (): Promise<void> => {
      const usedProcessors = strictCollectMemberUsage(raw, "PROCESSORS", 2);
      await loadProcessorsImperatively(
        usedProcessors,
        runtimeContext.brickPackages
      );
      globalVariables.PROCESSORS = new Proxy(Object.freeze({}), {
        get(target: unknown, key: string) {
          const pkg = customProcessors.get(key);
          if (!pkg) {
            throw new Error(
              `'PROCESSORS.${key}' is not registered! Have you installed the relevant brick package?`
            );
          }
          return new Proxy(Object.freeze({}), {
            get(t: unknown, k: string) {
              return pkg.get(k);
            },
          });
        },
      });
    };
    blockingList.push(loadProcessors());
  }

  if (attemptToVisitGlobals.has("CTX")) {
    const loadContexts = async (): Promise<void> => {
      const usedCtx = strictCollectMemberUsage(raw, "CTX");
      await runtimeContext.ctxStore.waitFor(usedCtx);
      globalVariables.CTX = new Proxy(Object.freeze({}), {
        get(target: unknown, key: string) {
          return runtimeContext.ctxStore.getValue(key);
        },
      });
    };
    blockingList.push(loadContexts());
  }

  if (attemptToVisitGlobals.has("QUERY")) {
    globalVariables.QUERY = Object.fromEntries(
      Array.from(runtimeContext.query.keys()).map((key) => [
        key,
        runtimeContext.query.get(key),
      ])
    );
  }

  let attemptToCheckPermissions = attemptToVisitGlobals.has("PERMISSIONS");
  if (attemptToVisitGlobals.has("FN")) {
    // There maybe `PERMISSIONS.check()` usage in functions
    if (!attemptToCheckPermissions) {
      const usedFunctions = [...strictCollectMemberUsage(raw, "FN")];
      attemptToCheckPermissions = checkPermissionsUsage(usedFunctions);
    }
  }

  if (attemptToCheckPermissions) {
    blockingList.push(...runtimeContext.pendingPermissionsPreCheck);
  }

  // if (attemptToVisitState && runtimeContext.tplContextId) {
  //   const tplContext = getCustomTemplateContext(runtimeContext.tplContextId);
  //   if (attemptToVisitState) {
  //     globalVariables.STATE = getDynamicReadOnlyProxy({
  //       get(target, key: string) {
  //         return tplContext.state.getValue(key);
  //       },
  //       ownKeys() {
  //         return Array.from(tplContext.state.get().keys());
  //       },
  //     });
  //   }
  // }

  // if (attemptToVisitFormState && runtimeContext.formContextId) {
  //   const formContext = getCustomFormContext(runtimeContext.formContextId);
  //   globalVariables.FORM_STATE = getDynamicReadOnlyProxy({
  //     get(target, key: string) {
  //       return formContext.formState.getValue(key);
  //     },
  //     ownKeys() {
  //       return Array.from(formContext.formState.get().keys());
  //     },
  //   });
  // }

  // await Promise.all(blockingList);

  return {
    blockingList,
    run() {
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
