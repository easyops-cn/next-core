import { message } from "antd";
import {
  BrickEventHandler,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  CustomBrickEventHandler,
  PluginRuntimeContext,
  ExecuteCustomBrickEventHandler,
  SetPropsCustomBrickEventHandler,
  RuntimeBrickElement,
} from "@easyops/brick-types";
import { handleHttpError } from "./handleHttpError";
import { computeRealValue, setProperties } from "./setProperties";
import { getHistory } from "./history";
import { _internalApiGetCurrentContext } from "./core/exports";
import { getUrlFactory } from "./segue";

export function bindListeners(
  brick: HTMLElement,
  eventsMap: BrickEventsMap,
  context?: PluginRuntimeContext
): void {
  Object.entries(eventsMap).forEach(([eventType, handlers]) => {
    [].concat(handlers).forEach((handler: BrickEventHandler) => {
      const listener = listenerFactory(handler, context, brick);
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
  return typeof (handler as BuiltinBrickEventHandler).action === "string";
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
  handler: BrickEventHandler,
  context: PluginRuntimeContext,
  brick: HTMLElement
): EventListener {
  if (isBuiltinHandler(handler)) {
    const method = handler.action.split(".")[1] as any;
    switch (handler.action) {
      case "history.push":
      case "history.replace":
      case "history.pushQuery":
      case "history.replaceQuery":
      case "history.pushAnchor":
        return builtinHistoryListenerFactory(method, handler.args, context);
      case "history.goBack":
      case "history.goForward":
      case "history.reload":
        return builtinHistoryWithoutArgsListenerFactory(method);
      case "legacy.go":
        return builtinIframeListenerFactory(handler.args, context);
      case "window.open":
        return builtinWindowListenerFactory(handler.args, context);
      case "location.reload":
      case "location.assign":
        return builtinLocationListenerFactory(method, handler.args, context);
      case "segue.push":
      case "segue.replace":
        return builtinSegueListenerFactory(method, handler.args, context);
      case "event.preventDefault":
        return (event) => {
          event.preventDefault();
        };
      case "console.log":
      case "console.error":
      case "console.warn":
      case "console.info":
        return builtinConsoleListenerFactory(method, handler.args, context);
      case "message.success":
      case "message.error":
      case "message.info":
      case "message.warn":
        return builtinMessageListenerFactory(method, handler.args, context);
      case "handleHttpError":
        return (event: any) => {
          handleHttpError(event.detail);
        };
      default:
        return () => {
          // eslint-disable-next-line no-console
          console.error("unknown event listener action:", handler.action);
        };
    }
  }

  if (isCustomHandler(handler)) {
    return customListenerFactory(handler, context, brick);
  }
}

function builtinLocationListenerFactory(
  method: "assign" | "reload",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (method === "assign") {
      const [url] = argsFactory(args, context, event);
      location.assign(url);
    } else {
      location[method]();
    }
  } as EventListener;
}

function builtinSegueListenerFactory(
  method: "push" | "replace",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    const { app, segues } = _internalApiGetCurrentContext();
    getHistory()[method](
      getUrlFactory(
        app,
        segues
      )(
        ...(argsFactory(args, context, event) as Parameters<
          ReturnType<typeof getUrlFactory>
        >)
      )
    );
  } as EventListener;
}

function builtinIframeListenerFactory(
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  const legacyIframeMountPoint = document.querySelector(
    "#legacy-iframe-mount-point"
  );

  const postMessage = (url: string): void => {
    const iframe = legacyIframeMountPoint.firstChild as HTMLIFrameElement;
    if (
      iframe &&
      iframe.contentWindow &&
      (iframe.contentWindow as any).angular
    ) {
      iframe.contentWindow.postMessage(
        {
          type: "location.url",
          url,
        },
        location.origin
      );
    }
  };

  return function (event: CustomEvent): void {
    const [url] = argsFactory(args, context, event);
    postMessage(url);
  } as EventListener;
}

function builtinWindowListenerFactory(
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    const [url, target] = argsFactory(args, context, event);
    window.open(url, target || "_self");
  } as EventListener;
}

function findRefElement(brick: RuntimeBrickElement, ref: string): HTMLElement {
  let tpl = brick;
  while ((tpl = tpl.parentElement)) {
    if (tpl.$$typeof === "custom-template") {
      return tpl.$$getElementByRef?.(ref);
    }
  }
}

function customListenerFactory(
  handler: CustomBrickEventHandler,
  context: PluginRuntimeContext,
  brick: HTMLElement
): EventListener {
  return function (event: CustomEvent): void {
    let targets: any[] = [];
    if (typeof handler.target === "string") {
      if (handler.target === "_self") {
        targets.push(brick);
      } else if (handler.multiple) {
        targets = Array.from(document.querySelectorAll(handler.target));
      } else {
        const found = document.querySelector(handler.target);
        if (found !== null) {
          targets.push(found);
        }
      }
    } else if (handler.target) {
      targets.push(handler.target);
    } else if (handler.targetRef) {
      const found = findRefElement(brick, handler.targetRef);
      if (found) {
        targets.push(found);
      }
    }
    if (targets.length === 0) {
      // eslint-disable-next-line no-console
      console.error("target not found:", handler.target || handler.targetRef);
      return;
    }
    if (isExecuteCustomHandler(handler)) {
      targets.forEach(async (target) => {
        if (typeof target[handler.method] !== "function") {
          // eslint-disable-next-line no-console
          console.error("target has no method:", {
            target,
            method: handler.method,
          });
          return;
        }
        const task = target[handler.method](
          ...argsFactory(handler.args, context, event)
        );
        const { success, error } = handler.callback ?? {};
        if (success || error) {
          try {
            const result = await task;
            if (success) {
              const successEvent = new CustomEvent("callback.success", {
                detail: result,
              });
              [].concat(success).forEach((eachSuccess) => {
                listenerFactory(eachSuccess, context, brick)(successEvent);
              });
            }
          } catch (err) {
            if (error) {
              const errorEvent = new CustomEvent("callback.error", {
                detail: err,
              });
              [].concat(error).forEach((eachError) => {
                listenerFactory(eachError, context, brick)(errorEvent);
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
          event,
        },
        handler.injectDeep !== false
      );
    }
  } as EventListener;
}

function builtinHistoryListenerFactory(
  method: "push" | "replace" | "pushQuery" | "replaceQuery" | "pushAnchor",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    (getHistory()[method] as any)(...argsFactory(args, context, event, true));
  } as EventListener;
}

function builtinHistoryWithoutArgsListenerFactory(
  method: "goBack" | "goForward" | "reload"
): EventListener {
  return function (): void {
    getHistory()[method]();
  } as EventListener;
}

function builtinConsoleListenerFactory(
  method: "log" | "error" | "warn" | "info",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    // eslint-disable-next-line no-console
    console[method](...argsFactory(args, context, event));
  } as EventListener;
}

function builtinMessageListenerFactory(
  method: "success" | "error" | "info" | "warn",
  args: any[],
  context?: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent) {
    (message[method] as any)(...argsFactory(args, context, event));
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
          event,
        },
        true
      )
    : [useEventDetailAsDefault ? event.detail : event];
}
