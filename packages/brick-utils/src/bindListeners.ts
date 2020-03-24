/**
 * @deprecated
 * Have been moved to `@easyops/brick-kit`.
 * The legacy code below is for backward compatibility only.
 */

import {
  BrickEventHandler,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  CustomBrickEventHandler,
  PluginHistory,
  PluginRuntimeContext,
  ExecuteCustomBrickEventHandler,
  SetPropsCustomBrickEventHandler,
  RuntimeBrickElement
} from "@easyops/brick-types";
import { computeRealValue, setProperties } from "./setProperties";

export function bindListeners(
  brick: HTMLElement,
  eventsMap: BrickEventsMap,
  history: PluginHistory,
  context?: PluginRuntimeContext
): void {
  // eslint-disable-next-line no-console
  console.warn("`bindListeners` function is deprecated");

  Object.entries(eventsMap).forEach(([eventType, handlers]) => {
    [].concat(handlers).forEach((handler: BrickEventHandler) => {
      const listener = listenerFactory(handler, history, context);
      brick.addEventListener(eventType, listener);
      rememberListeners(brick, eventType, listener);
    });
  });
}

export function unbindListeners(brick: HTMLElement): void {
  // eslint-disable-next-line no-console
  console.warn("`unbindListeners` function is deprecated");
  if ((brick as RuntimeBrickElement).$$eventListeners) {
    for (const [eventType, listener] of (brick as RuntimeBrickElement)
      .$$eventListeners) {
      brick.removeEventListener(eventType, listener);
    }
    (brick as RuntimeBrickElement).$$eventListeners = [];
  }
}

function rememberListeners(
  brick: RuntimeBrickElement,
  eventType: string,
  listener: EventListener
): void {
  if (!brick.$$eventListeners) {
    brick.$$eventListeners = [];
  }
  brick.$$eventListeners.push([eventType, listener]);
}

export function isBuiltinHandler(
  handler: BrickEventHandler
): handler is BuiltinBrickEventHandler {
  return !!(handler as BuiltinBrickEventHandler).action;
}

export function isCustomHandler(
  handler: BrickEventHandler
): handler is CustomBrickEventHandler {
  return !!(
    (handler as CustomBrickEventHandler).target &&
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
  handler: BrickEventHandler,
  history: PluginHistory,
  context?: PluginRuntimeContext
): EventListener {
  if (isBuiltinHandler(handler)) {
    const method = handler.action.split(".")[1] as any;
    switch (handler.action) {
      case "history.push":
      case "history.replace":
      case "history.pushQuery":
      case "history.replaceQuery":
      case "history.pushAnchor":
        return builtinHistoryListenerFactory(
          method,
          handler.args,
          history,
          context
        );
      case "history.goBack":
      case "history.goForward":
      case "history.reload":
        return builtinHistoryWithoutArgsListenerFactory(method, history);
      case "legacy.go":
        return builtinIframeListenerFactory(method, handler.args, context);
      case "window.open":
        return builtinWindowListenerFactory(method, handler.args, context);
      case "location.reload":
      case "location.assign":
        return builtinLocationListenerFactory(method, handler.args, context);
      case "event.preventDefault":
        return event => {
          event.preventDefault();
        };
      case "console.log":
      case "console.error":
      case "console.warn":
      case "console.info":
        return builtinConsoleListenerFactory(method, handler.args, context);
      default:
        return () => {
          /*global process*/
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn("unknown event listener action:", handler.action);
          }
        };
    }
  }

  if (isCustomHandler(handler)) {
    return customListenerFactory(handler, history, context);
  }
}

function builtinLocationListenerFactory(
  method: "assign" | "reload",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function(event: CustomEvent): void {
    if (method === "assign") {
      const [url] = argsFactory(args, context, event);
      location.assign(url);
    } else {
      location[method]();
    }
  } as EventListener;
}

function builtinIframeListenerFactory(
  method: "legacy.go",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  const legacyIframeMountPoint = document.querySelector(
    "#legacy-iframe-mount-point"
  );

  const postMessage = (url: string) => {
    const iframe = legacyIframeMountPoint.firstChild as HTMLIFrameElement;
    if (
      iframe &&
      iframe.contentWindow &&
      (iframe.contentWindow as any).angular
    ) {
      iframe.contentWindow.postMessage(
        {
          type: "location.url",
          url
        },
        location.origin
      );
    }
  };

  return function(event: CustomEvent): void {
    const [url] = argsFactory(args, context, event);
    postMessage(url);
  } as EventListener;
}

function builtinWindowListenerFactory(
  method: "open",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function(event: CustomEvent): void {
    const [url, target] = argsFactory(args, context, event);
    window.open(url, target || "_self");
  } as EventListener;
}

function customListenerFactory(
  handler: CustomBrickEventHandler,
  history: PluginHistory,
  context?: PluginRuntimeContext
): EventListener {
  return function(event: CustomEvent): void {
    let targets: any[] = [];
    if (typeof handler.target === "string") {
      if (handler.multiple) {
        targets = Array.from(document.querySelectorAll(handler.target));
      } else {
        const found = document.querySelector(handler.target);
        if (found !== null) {
          targets.push(found);
        }
      }
    } else if (handler.target) {
      targets.push(handler.target);
    }
    if (targets.length === 0) {
      if (process.env.NODE_ENV !== "test") {
        // eslint-disable-next-line no-console
        console.error("target not found:", handler.target);
      }
      return;
    }
    if (isExecuteCustomHandler(handler)) {
      targets.forEach(async target => {
        const task = target[handler.method]?.(
          ...argsFactory(handler.args, context, event)
        );
        const { success, error } = handler.callback ?? {};
        if (success || error) {
          try {
            const result = await task;
            if (success) {
              const successEvent = new CustomEvent("callback.success", {
                detail: result
              });
              [].concat(success).forEach(eachSuccess => {
                listenerFactory(eachSuccess, history, context)(successEvent);
              });
            }
          } catch (err) {
            if (error) {
              const errorEvent = new CustomEvent("callback.error", {
                detail: err
              });
              [].concat(error).forEach(eachError => {
                listenerFactory(eachError, history, context)(errorEvent);
              });
            }
          }
        }
      });
    } else if (isSetPropsCustomHandler(handler)) {
      setProperties(
        targets,
        handler.properties,
        {
          ...context,
          event
        },
        handler.injectDeep !== false
      );
    }
  } as EventListener;
}

function builtinHistoryListenerFactory(
  method: "push" | "replace" | "pushQuery" | "replaceQuery" | "pushAnchor",
  args: any[],
  history: PluginHistory,
  context?: PluginRuntimeContext
): EventListener {
  return function(event: CustomEvent): void {
    (history[method] as any)(...argsFactory(args, context, event, true));
  } as EventListener;
}

function builtinHistoryWithoutArgsListenerFactory(
  method: "goBack" | "goForward" | "reload",
  history: PluginHistory
): EventListener {
  return function(): void {
    history[method]();
  } as EventListener;
}

function builtinConsoleListenerFactory(
  method: "log" | "error" | "warn" | "info",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function(event: CustomEvent): void {
    // eslint-disable-next-line no-console
    console[method](...argsFactory(args, context, event));
  } as EventListener;
}

function argsFactory(
  args: any[],
  context: PluginRuntimeContext,
  event: CustomEvent,
  useEventDetailAsDefault?: boolean
): any {
  return Array.isArray(args)
    ? computeRealValue(
        args,
        {
          ...context,
          event
        },
        true
      )
    : [useEventDetailAsDefault ? event.detail : event];
}
