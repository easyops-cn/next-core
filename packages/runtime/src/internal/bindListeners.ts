import type {
  BrickEventHandler,
  BrickEventHandlerCallback,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  CustomBrickEventHandler,
  ExecuteCustomBrickEventHandler,
  ProviderPollOptions,
  SetPropsCustomBrickEventHandler,
  SiteTheme,
  UseProviderEventHandler,
  ConditionalEventHandler,
  BatchUpdateContextItem,
  UseProviderContractConf,
} from "@next-core/types";
import { isEvaluable } from "@next-core/cook";
import { isObject } from "@next-core/utils/general";
import { pick } from "lodash";
import { checkIf } from "./compute/checkIf.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import { getHistory } from "../history.js";
import { getProviderBrick } from "./data/getProviderBrick.js";
import { PollableCallback, startPoll } from "./poll.js";
import { isPreEvaluated } from "./compute/evaluate.js";
import { setProperties } from "./compute/setProperties.js";
import { applyMode, applyTheme } from "../themeAndMode.js";
import type {
  ElementHolder,
  RuntimeBrickElement,
  RuntimeContext,
} from "./interfaces.js";
import {
  getTplHostElement,
  getTplStateStore,
} from "./CustomTemplates/utils.js";
import { handleHttpError } from "../handleHttpError.js";
import { Notification } from "../Notification.js";
import { getFormStateStore } from "./FormRenderer/utils.js";
import { DataStore } from "./data/DataStore.js";
import { hooks } from "./Runtime.js";
import { startSSEStream } from "./sse.js";

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

export function isConditionalEventHandler(
  handler: BrickEventHandler
): handler is ConditionalEventHandler {
  return !!(handler as ConditionalEventHandler).then;
}

export function listenerFactory(
  handlers: BrickEventHandler | BrickEventHandler[],
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder
) {
  return function (event: Event): void {
    for (const handler of ([] as BrickEventHandler[]).concat(handlers)) {
      if (!checkIf(handler, { ...runtimeContext, event })) {
        if (handler.else) {
          listenerFactory(handler.else, runtimeContext, runtimeBrick)(event);
        }
        continue;
      }

      if (isConditionalEventHandler(handler)) {
        listenerFactory(handler.then, runtimeContext, runtimeBrick)(event);
      } else if (isBuiltinHandler(handler)) {
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
            handleWindowOpenAction(event, handler.args, runtimeContext);
            break;

          case "window.postMessage":
            handleWindowPostMessageAction(event, handler.args, runtimeContext);
            break;

          case "parent.postMessage":
            handleParentPostMessageAction(event, handler.args, runtimeContext);
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
          case "event.stopPropagation":
            event.stopPropagation();
            break;

          case "console.log":
          case "console.error":
          case "console.warn":
          case "console.info":
            handleConsoleAction(event, method, handler.args, runtimeContext);
            break;

          case "message.success":
          case "message.error":
          case "message.info":
          case "message.warn":
            handleMessageAction(event, method, handler.args, runtimeContext);
            break;

          case "handleHttpError":
            handleHttpError((event as CustomEvent).detail);
            break;

          case "context.assign":
          case "context.replace":
          case "context.refresh":
          case "context.load":
            handleContextAction(
              event,
              method,
              handler.args,
              handler.batch ?? true,
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
              handler.batch ?? true,
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

          case "formstate.update":
            handleFormStateAction(
              event,
              handler.args,
              handler.callback,
              runtimeContext
            );
            break;

          case "message.subscribe":
          case "message.unsubscribe":
            handleMessageDispatcher(
              event,
              method,
              handler.args,
              runtimeContext,
              runtimeBrick,
              handler.callback
            );
            break;

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

function handleUseProviderAction(
  event: Event,
  handler: UseProviderEventHandler,
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder
) {
  const method = handler.method !== "saveAs" ? "resolve" : "saveAs";
  brickCallback(
    event,
    handler.useProvider,
    handler,
    method,
    runtimeContext,
    runtimeBrick
  );
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
  targetOrProvider: HTMLElement | string,
  handler: ExecuteCustomBrickEventHandler | UseProviderEventHandler,
  method: string,
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder,
  options?: ArgsFactoryOptions
): Promise<void> {
  const isProvider = isUseProviderHandler(handler);

  const task = async (): Promise<unknown> => {
    const realTarget = isProvider
      ? await getProviderBrick(targetOrProvider as string)
      : (targetOrProvider as HTMLElement);

    if (typeof (realTarget as any)[method] !== "function") {
      throw new Error(
        `target <${realTarget.tagName.toLowerCase()}> has no method: ${method}`
      );
    }

    let computedArgs: unknown[] | UseProviderContractConf = argsFactory(
      handler.args,
      runtimeContext,
      event,
      options
    );
    if (
      isUseProviderHandler(handler) &&
      hooks?.flowApi?.isFlowApiProvider(handler.useProvider)
    ) {
      if (!Array.isArray(handler.args) && handler.params) {
        computedArgs = computeRealValue(
          pick(handler, "params", "options", "filename"),
          {
            ...runtimeContext,
            event,
          }
        ) as UseProviderContractConf;
      }

      computedArgs = await hooks.flowApi.getArgsOfFlowApi(
        handler.useProvider,
        computedArgs,
        method,
        handler.sse?.stream
      );
    }
    return (realTarget as any)[method](...computedArgs);
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

  if (isProvider) {
    const pollRuntimeContext = {
      ...runtimeContext,
      event,
    };

    const sseStream = computeRealValue(
      handler.sse?.stream,
      pollRuntimeContext
    ) as boolean | undefined;

    if (sseStream) {
      startSSEStream(
        task as () => Promise<AsyncIterable<unknown>>,
        pollableCallback
      );
      return;
    }

    const pollEnabled = computeRealValue(
      handler.poll?.enabled,
      pollRuntimeContext
    ) as boolean | undefined;

    if (pollEnabled) {
      startPoll(
        task,
        pollableCallback,
        handler.poll as ProviderPollOptions,
        pollRuntimeContext
      );

      return;
    }
  }

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

function handleWindowOpenAction(
  event: Event,
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  const [url, target, features] = argsFactory(args, runtimeContext, event) as [
    string,
    string,
    string,
  ];
  window.open(url, target || "_self", features);
}

function handleWindowPostMessageAction(
  event: Event,
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  const computedArgs = argsFactory(args, runtimeContext, event) as Parameters<
    typeof window.postMessage
  >;
  if (computedArgs.length === 1) {
    // Add default target origin
    computedArgs.push(location.origin);
  }
  window.postMessage(...computedArgs);
}

function handleParentPostMessageAction(
  event: Event,
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  if (parent === window) {
    throw new Error("parent is the window itself");
  }
  const computedArgs = argsFactory(args, runtimeContext, event) as Parameters<
    typeof window.postMessage
  >;
  parent.postMessage(...computedArgs);
}

function batchUpdate(
  args: unknown[],
  batch: boolean,
  method: "replace" | "assign",
  store: DataStore<"CTX" | "STATE">,
  runtimeContext: RuntimeContext,
  event: CustomEvent | Event
): void {
  if (batch) {
    store.updateValues(
      args as BatchUpdateContextItem[],
      method,
      (arg: unknown[]) => {
        return argsFactory(
          arg,
          runtimeContext,
          event
        )[0] as BatchUpdateContextItem;
      }
    );
  } else {
    args.forEach((arg) => {
      const { name, value } = argsFactory(
        [arg],
        runtimeContext,
        event
      )[0] as BatchUpdateContextItem;
      store.updateValue(name, value, method);
    });
  }
}

function handleContextAction(
  event: Event,
  method: "assign" | "replace",
  args: unknown[] | undefined,
  batch: boolean,
  callback: BrickEventHandlerCallback | undefined,
  runtimeContext: RuntimeContext
) {
  const isBatch = Array.isArray(args) && args.every(isObject);
  if (isBatch && (method === "assign" || method === "replace")) {
    batchUpdate(
      args,
      batch,
      method,
      runtimeContext.ctxStore,
      runtimeContext,
      event
    );
  } else {
    const [name, value] = argsFactory(args, runtimeContext, event);
    runtimeContext.ctxStore.updateValue(
      name as string,
      value,
      method,
      callback,
      runtimeContext
    );
  }
}

function handleTplStateAction(
  event: Event,
  method: "update" | "refresh" | "load",
  args: unknown[] | undefined,
  batch: boolean,
  callback: BrickEventHandlerCallback | undefined,
  runtimeContext: RuntimeContext
) {
  const isBatch = Array.isArray(args) && args.every(isObject);
  if (isBatch && method === "update") {
    const tplStateStore = getTplStateStore(
      runtimeContext,
      `state.${method}`,
      `: ${JSON.stringify(args)}`
    );
    batchUpdate(args, batch, "replace", tplStateStore, runtimeContext, event);
  } else {
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
}

function handleFormStateAction(
  event: Event,
  args: unknown[] | undefined,
  callback: BrickEventHandlerCallback | undefined,
  runtimeContext: RuntimeContext
) {
  const [name, value] = argsFactory(args, runtimeContext, event);
  const formStateStore = getFormStateStore(
    runtimeContext,
    "formstate.update",
    `: ${name}`
  );
  formStateStore.updateValue(
    name as string,
    value,
    "replace",
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

function handleMessageAction(
  event: Event,
  method: "success" | "error" | "info" | "warn",
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  const computedArgs = argsFactory(args, runtimeContext, event, {
    useEventAsDefault: true,
  });
  Notification.show({
    type: method,
    message: computedArgs[0] as string,
  });
}

async function handleMessageDispatcher(
  event: Event,
  method: "subscribe" | "unsubscribe",
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext,
  runtimeBrick?: ElementHolder,
  callback?: BrickEventHandlerCallback
) {
  const task = () => {
    const computedArgs = argsFactory(args, runtimeContext, event);
    return hooks?.messageDispatcher?.[method](...computedArgs);
  };
  if (!callback) {
    task();
    return;
  }
  const callbackFactory = eventCallbackFactory(
    callback,
    runtimeContext,
    runtimeBrick
  );
  try {
    const result = await task();
    callbackFactory("success")(result);
  } catch (error) {
    callbackFactory("error")(error);
  } finally {
    callbackFactory("finally")();
  }
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
