import type {
  BrickEventHandler,
  BrickEventHandlerCallback,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  CustomBrickEventHandler,
  ExecuteCustomBrickEventHandler,
  ProviderPollOptions,
  RuntimeBrickElement,
  SetPropsCustomBrickEventHandler,
  SiteTheme,
  UseProviderEventHandler,
} from "@next-core/brick-types";
import { isEvaluable } from "@next-core/cook";
import { checkIf } from "./compute/checkIf.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import { getHistory } from "../history.js";
import { getProviderBrick } from "./data/getProviderBrick.js";
import { PollableCallback, startPoll } from "./poll.js";
import { isPreEvaluated } from "./compute/evaluate.js";
import { setProperties } from "./compute/setProperties.js";
import { applyMode, applyTheme } from "../themeAndMode.js";
import type { ElementHolder, RuntimeContext } from "./interfaces.js";
import {
  getTplHostElement,
  getTplStateStore,
} from "./CustomTemplates/utils.js";

export function bindListeners(
  brick: RuntimeBrickElement,
  eventsMap: BrickEventsMap | undefined,
  runtimeContext: RuntimeContext
): void {
  if (!eventsMap) {
    return;
  }
  Object.entries(eventsMap).forEach(([eventType, handlers]) => {
    const listener = listenerFactory(handlers, runtimeContext, {
      element: brick,
    });
    brick.addEventListener(eventType, listener);

    // Remember added listeners for unbinding.
    if (!brick.$$listeners) {
      brick.$$listeners = [];
    }
    brick.$$listeners.push([eventType, listener]);

    // Remember added listeners for devtools.
    if (!brick.$$eventListeners) {
      brick.$$eventListeners = [];
    }
    for (const handler of ([] as BrickEventHandler[]).concat(handlers)) {
      brick.$$eventListeners.push([eventType, null, handler]);
    }
  });
}

export function unbindListeners(brick: RuntimeBrickElement): void {
  if (brick.$$listeners) {
    for (const [eventType, listener] of brick.$$listeners) {
      brick.removeEventListener(eventType, listener);
    }
    brick.$$listeners.length = 0;
  }
}

export function isBuiltinHandler(
  handler: BrickEventHandler
): handler is BuiltinBrickEventHandler {
  return typeof (handler as BuiltinBrickEventHandler).action === "string";
}

export function isUseProviderHandler(
  handler: BrickEventHandler
): handler is UseProviderEventHandler {
  return typeof (handler as UseProviderEventHandler).useProvider === "string";
}

export function isCustomHandler(
  handler: BrickEventHandler
): handler is CustomBrickEventHandler {
  return !!(
    ((handler as CustomBrickEventHandler).target ||
      (handler as CustomBrickEventHandler).targetRef) &&
    ((handler as ExecuteCustomBrickEventHandler).method ||
      (handler as SetPropsCustomBrickEventHandler).properties)
  );
}

export function isExecuteCustomHandler(
  handler: CustomBrickEventHandler
): handler is ExecuteCustomBrickEventHandler {
  return !!(handler as ExecuteCustomBrickEventHandler).method;
}

export function isSetPropsCustomHandler(
  handler: CustomBrickEventHandler
): handler is SetPropsCustomBrickEventHandler {
  return !!(handler as SetPropsCustomBrickEventHandler).properties;
}

export function listenerFactory(
  handlers: BrickEventHandler | BrickEventHandler[],
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder
) {
  return function (event: Event): void {
    for (const handler of ([] as BrickEventHandler[]).concat(handlers)) {
      if (!checkIf(handler, runtimeContext)) {
        continue;
      }
      if (isBuiltinHandler(handler)) {
        const [object, method] = handler.action.split(".") as any;
        switch (handler.action) {
          case "history.push":
          case "history.replace":
          case "history.pushQuery":
          case "history.replaceQuery":
          case "history.pushAnchor":
          case "history.block":
          case "history.goBack":
          case "history.goForward":
          case "history.reload":
          case "history.unblock":
            handleHistoryAction(
              event,
              method,
              handler.args,
              handler.callback,
              runtimeContext
            );
            break;

          // case "segue.push":
          // case "segue.replace":
          // case "alias.push":
          // case "alias.replace":

          case "window.open":
            handleWindowAction(event, handler.args, runtimeContext);
            break;

          case "location.reload":
          case "location.assign":
            handleLocationAction(event, method, handler.args, runtimeContext);
            break;

          case "localStorage.setItem":
          case "localStorage.removeItem":
          case "sessionStorage.setItem":
          case "sessionStorage.removeItem":
            handleStorageAction(
              event,
              object,
              method,
              handler.args,
              runtimeContext
            );
            break;

          case "event.preventDefault":
            event.preventDefault();
            break;

          case "console.log":
            handleConsoleAction(event, method, handler.args, runtimeContext);
            break;

          // case "message.success":
          // case "message.error":
          // case "message.info":
          // case "message.warn":

          // case "handleHttpError":

          case "context.assign":
          case "context.replace":
          case "context.refresh":
          case "context.load":
            handleContextAction(
              event,
              method,
              handler.args,
              handler.callback,
              runtimeContext
            );
            break;

          case "state.update":
          case "state.refresh":
          case "state.load":
            handleTplStateAction(
              event,
              method,
              handler.args,
              handler.callback,
              runtimeContext
            );
            break;

          case "tpl.dispatchEvent": {
            const [type, init] = argsFactory(
              handler.args,
              runtimeContext,
              event
            ) as [string, CustomEventInit];
            const tplHostElement = getTplHostElement(
              runtimeContext,
              handler.action,
              `: ${type}`
            );
            tplHostElement.dispatchEvent(new CustomEvent(type, init));
            break;
          }

          // case "formstate.update":

          // case "message.subscribe":
          // case "message.unsubscribe":

          case "theme.setDarkTheme":
          case "theme.setLightTheme":
            applyTheme(
              handler.action === "theme.setDarkTheme" ? "dark" : "light"
            );
            break;
          case "theme.setTheme": {
            const [theme] = argsFactory(handler.args, runtimeContext, event);
            applyTheme(theme as SiteTheme);
            break;
          }
          case "mode.setDashboardMode":
          case "mode.setDefaultMode":
            applyMode(
              handler.action === "mode.setDashboardMode"
                ? "dashboard"
                : "default"
            );
            break;

          // case "menu.clearMenuTitleCache":
          // case "menu.clearMenuCache":

          // case "analytics.event":

          // case "preview.debug":

          default:
            // eslint-disable-next-line no-console
            console.error("unknown event listener action:", handler.action);
        }
      } else if (isUseProviderHandler(handler)) {
        handleUseProviderAction(event, handler, runtimeContext, runtimeBrick);
      } else if (isCustomHandler(handler)) {
        handleCustomAction(event, handler, runtimeContext, runtimeBrick!);
      } else {
        // eslint-disable-next-line no-console
        console.error("unknown event handler:", handler);
      }
    }
  };
}

async function handleUseProviderAction(
  event: Event,
  handler: UseProviderEventHandler,
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder
) {
  try {
    const providerBrick = await getProviderBrick(
      handler.useProvider,
      runtimeContext.brickPackages
    );
    const method = handler.method !== "saveAs" ? "resolve" : "saveAs";
    brickCallback(
      event,
      providerBrick,
      handler,
      method,
      runtimeContext,
      runtimeBrick
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    // console.error(httpErrorToString(error));
  }
}

function handleCustomAction(
  event: Event,
  handler: CustomBrickEventHandler,
  runtimeContext: RuntimeContext,
  runtimeBrick: ElementHolder
) {
  let targets: HTMLElement[] = [];
  const rawTarget = handler.target;
  const rawTargetRef = handler.targetRef;
  let computedTarget = rawTarget;
  // Allow `target` to be set as evaluable string.
  if (
    typeof rawTarget === "string"
      ? isEvaluable(rawTarget)
      : isPreEvaluated(rawTarget)
  ) {
    computedTarget = computeRealValue(rawTarget, { ...runtimeContext, event });
  }
  if (typeof computedTarget === "string") {
    if (computedTarget === "_self") {
      targets.push(runtimeBrick.element!);
    } else if (handler.multiple) {
      targets = Array.from(document.querySelectorAll(computedTarget));
    } else {
      const found = document.querySelector(computedTarget) as HTMLElement;
      if (found !== null) {
        targets.push(found);
      }
    }
  } else if (computedTarget) {
    if (computedTarget instanceof HTMLElement) {
      targets.push(computedTarget as HTMLElement);
    } else {
      // eslint-disable-next-line no-console
      console.error("unexpected target:", computedTarget);
    }
  } else if (rawTargetRef) {
    let computedTargetRef = rawTargetRef;
    // Allow `targetRef` to be set as evaluable string.
    if (
      typeof rawTargetRef === "string"
        ? isEvaluable(rawTargetRef)
        : isPreEvaluated(rawTargetRef)
    ) {
      computedTargetRef = computeRealValue(rawTargetRef, {
        ...runtimeContext,
        event,
      }) as string | string[];
    }
    const targetRefs = ([] as string[]).concat(computedTargetRef);
    const tplHostElement = getTplHostElement(
      runtimeContext,
      "targetRef",
      `: ${targetRefs.join(", ")}`
    );
    targets.push(
      ...(targetRefs
        .map((ref) => tplHostElement.$$getElementByRef?.(ref))
        .filter(Boolean) as HTMLElement[])
    );
  }
  if (targets.length === 0) {
    // eslint-disable-next-line no-console
    console.error("target not found:", rawTarget || rawTargetRef);
    return;
  }
  if (isExecuteCustomHandler(handler)) {
    targets.forEach((target) => {
      brickCallback(
        event,
        target,
        handler,
        handler.method,
        runtimeContext,
        runtimeBrick,
        {
          useEventAsDefault: true,
        }
      );
    });
  } else if (isSetPropsCustomHandler(handler)) {
    setProperties(targets, handler.properties, {
      ...runtimeContext,
      event,
    });
  }
}

async function brickCallback(
  event: Event,
  target: HTMLElement,
  handler: ExecuteCustomBrickEventHandler | UseProviderEventHandler,
  method: string,
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder,
  options?: ArgsFactoryOptions
): Promise<void> {
  if (typeof (target as any)[method] !== "function") {
    // eslint-disable-next-line no-console
    console.error("target has no method:", {
      target,
      method: method,
    });
    return;
  }

  const task = async (): Promise<unknown> => {
    const computedArgs = argsFactory(
      handler.args,
      runtimeContext,
      event,
      options
    );
    // if (isUseProviderHandler(handler)) {
    //   computedArgs = await getArgsOfCustomApi(
    //     handler.useProvider,
    //     computedArgs,
    //     method
    //   );
    // }
    return (target as any)[method](...computedArgs);
  };

  if (!handler.callback) {
    task();
    return;
  }

  const callbackFactory = eventCallbackFactory(
    handler.callback,
    runtimeContext,
    runtimeBrick
  );

  const pollableCallback: Required<PollableCallback> = {
    progress: callbackFactory("progress"),
    success: callbackFactory("success"),
    error: callbackFactory("error"),
    finally: callbackFactory("finally"),
  };

  let poll: ProviderPollOptions | undefined;
  if (isUseProviderHandler(handler)) {
    poll = computeRealValue(handler.poll, { ...runtimeContext, event }) as
      | ProviderPollOptions
      | undefined;
  }

  if (poll?.enabled) {
    startPoll(task, pollableCallback, poll);
  } else {
    try {
      // Try to catch synchronized tasks too.
      const result = await task();
      pollableCallback.success(result);
    } catch (err) {
      pollableCallback.error(err);
    } finally {
      pollableCallback["finally"]();
    }
  }
}

function handleHistoryAction(
  event: Event,
  method:
    | "push"
    | "replace"
    | "pushQuery"
    | "replaceQuery"
    | "pushAnchor"
    | "block"
    | "goBack"
    | "goForward"
    | "reload"
    | "unblock",
  args: unknown[] | undefined,
  callback: BrickEventHandlerCallback | undefined,
  runtimeContext: RuntimeContext
) {
  let baseArgsLength = 0;
  let hasCallback = false;
  let overrideMethod = method as "setBlockMessage";
  switch (method) {
    case "push":
    case "replace":
    case "pushQuery":
    case "replaceQuery":
    case "pushAnchor":
      baseArgsLength = 2;
      hasCallback = true;
      break;
    case "reload":
      hasCallback = true;
      break;
    case "block":
      baseArgsLength = 1;
      overrideMethod = "setBlockMessage";
      break;
  }
  let computedArgs: unknown[] = [];
  if (baseArgsLength > 0) {
    computedArgs = argsFactory(args, runtimeContext, event, {
      useEventDetailAsDefault: true,
    });
    computedArgs.length = baseArgsLength;
  }
  if (hasCallback && callback) {
    const callbackFactory = eventCallbackFactory(
      callback,
      runtimeContext,
      undefined
    );
    computedArgs.push((blocked: boolean) => {
      callbackFactory(blocked ? "error" : "success")({ blocked });
      callbackFactory("finally")({ blocked });
    });
  }
  (getHistory()[overrideMethod] as (...args: unknown[]) => unknown)(
    ...computedArgs
  );
}

function handleWindowAction(
  event: Event,
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  const [url, target, features] = argsFactory(args, runtimeContext, event) as [
    string,
    string,
    string
  ];
  window.open(url, target || "_self", features);
}

function handleContextAction(
  event: Event,
  method: "assign" | "replace" | "refresh" | "load",
  args: unknown[] | undefined,
  callback: BrickEventHandlerCallback | undefined,
  runtimeContext: RuntimeContext
) {
  const [name, value] = argsFactory(args, runtimeContext, event);
  runtimeContext.ctxStore.updateValue(
    name as string,
    value,
    method,
    callback,
    runtimeContext
  );
}

function handleTplStateAction(
  event: Event,
  method: "update" | "refresh" | "load",
  args: unknown[] | undefined,
  callback: BrickEventHandlerCallback | undefined,
  runtimeContext: RuntimeContext
) {
  const [name, value] = argsFactory(args, runtimeContext, event);
  const tplStateStore = getTplStateStore(
    runtimeContext,
    `state.${method}`,
    `: ${name}`
  );
  tplStateStore.updateValue(
    name as string,
    value,
    method === "update" ? "replace" : method,
    callback,
    runtimeContext
  );
}

function handleLocationAction(
  event: Event,
  method: "assign" | "reload",
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  if (method === "assign") {
    const [url] = argsFactory(args, runtimeContext, event) as [string];
    location.assign(url);
  } else {
    location[method]();
  }
}

function handleStorageAction(
  event: Event,
  object: "localStorage" | "sessionStorage",
  method: "setItem" | "removeItem",
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  const storage = object === "localStorage" ? localStorage : sessionStorage;
  const [name, value] = argsFactory(args, runtimeContext, event);
  if (method === "setItem") {
    if (value !== undefined) {
      storage.setItem(name as string, JSON.stringify(value));
    }
  } else {
    storage.removeItem(name as string);
  }
}

function handleConsoleAction(
  event: Event,
  method: "log" | "error" | "warn" | "info",
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  // eslint-disable-next-line no-console
  console[method](
    ...argsFactory(args, runtimeContext, event, {
      useEventAsDefault: true,
    })
  );
}

export function eventCallbackFactory(
  callback: BrickEventHandlerCallback,
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder
) {
  return function callbackFactory(
    type: "success" | "error" | "finally" | "progress"
  ) {
    return function (result?: unknown) {
      const handlers = callback?.[type];
      if (handlers) {
        try {
          const event = new CustomEvent(`callback.${type}`, {
            detail: result,
          });
          listenerFactory(handlers, runtimeContext, runtimeBrick)(event);
        } catch (err) {
          // Do not throw errors in `callback.success` or `callback.progress`,
          // to avoid the following triggering of `callback.error`.
          // eslint-disable-next-line
          console.error(err);
        }
      } else if (type === "error") {
        // eslint-disable-next-line
        console.error("Unhandled callback error:", result);
      }
    };
  };
}

interface ArgsFactoryOptions {
  useEventAsDefault?: boolean;
  useEventDetailAsDefault?: boolean;
}

function argsFactory(
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext,
  event: Event,
  options: ArgsFactoryOptions = {}
): unknown[] {
  return Array.isArray(args)
    ? (computeRealValue(args, {
        ...runtimeContext,
        event,
      }) as unknown[])
    : options.useEventAsDefault
    ? [event]
    : options.useEventDetailAsDefault
    ? [(event as CustomEvent).detail]
    : [];
}
