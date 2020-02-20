import { Location } from "history";
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
import { isNil, forEach } from "lodash";
import { isObject } from "./isObject";

export function bindListeners(
  brick: HTMLElement,
  eventsMap: BrickEventsMap,
  history: PluginHistory,
  context?: PluginRuntimeContext
): void {
  Object.entries(eventsMap).forEach(([eventType, handlers]) => {
    [].concat(handlers).forEach((handler: BrickEventHandler) => {
      const listener = listenerFactory(handler, history, context);
      brick.addEventListener(eventType, listener);
      rememberListeners(brick, eventType, listener);
    });
  });
}

export function unbindListeners(brick: HTMLElement): void {
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
        return builtinHistoryListenerFactory(
          method,
          handler.args,
          history,
          context
        );
      case "history.goBack":
      case "history.goForward":
        return builtinHistoryWithoutArgsListenerFactory(method, history);
      case "history.pushQuery":
      case "history.replaceQuery":
        return builtinQueryListenerFactory(
          method,
          handler.args,
          history,
          context
        );
      case "history.reload":
        return () => {
          history.replace(history.location);
        };
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
    return customListenerFactory(handler, context);
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
      // eslint-disable-next-line no-console
      console.error("target not found:", handler.target);
      return;
    }
    if (isExecuteCustomHandler(handler)) {
      targets.forEach(target => {
        target[handler.method]?.(...argsFactory(handler.args, context, event));
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
  method: "push" | "replace",
  args: any[],
  history: PluginHistory,
  context?: PluginRuntimeContext
): EventListener {
  return function(event: CustomEvent): void {
    history[method](...(argsFactory(args, context, event, true) as [Location]));
  } as EventListener;
}

function builtinHistoryWithoutArgsListenerFactory(
  method: "goBack" | "goForward",
  history: PluginHistory
): EventListener {
  return function(): void {
    history[method]();
  } as EventListener;
}

function builtinQueryListenerFactory(
  method: "pushQuery" | "replaceQuery",
  args: any[],
  history: PluginHistory,
  context?: PluginRuntimeContext
): EventListener {
  return function(event: CustomEvent): void {
    const hasArgs = Array.isArray(args);
    const realMethod = method === "pushQuery" ? "push" : "replace";
    const urlSearchParams = new URLSearchParams(history.location.search);
    const assignArgs: Record<string, any> = {};
    if (hasArgs || isObject(event.detail)) {
      const realArgs = argsFactory(args, context, event, true);
      const extraQuery = hasArgs && realArgs[1] ? realArgs[1].extraQuery : {};
      Object.assign(assignArgs, realArgs[0], extraQuery);
      forEach(assignArgs, (v, k) => {
        if (Array.isArray(v)) {
          urlSearchParams.delete(k);
          for (const item of v) {
            urlSearchParams.append(k, item);
          }
        } else if (isNil(v) || v === "") {
          urlSearchParams.delete(k);
        } else {
          urlSearchParams.set(k, v);
        }
      });
      history[realMethod](`?${urlSearchParams.toString()}`);
    }
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
