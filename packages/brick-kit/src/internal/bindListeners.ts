import { message } from "antd";
import { userAnalytics } from "@next-core/easyops-analytics";
import {
  BrickEventHandler,
  BrickEventHandlerCallback,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  CustomBrickEventHandler,
  PluginRuntimeContext,
  ExecuteCustomBrickEventHandler,
  SetPropsCustomBrickEventHandler,
  RuntimeBrickElement,
  UseProviderEventHandler,
  ProviderPollOptions,
  SiteTheme,
} from "@next-core/brick-types";
import { handleHttpError, httpErrorToString } from "../handleHttpError";
import { computeRealValue, setProperties } from "./setProperties";
import { getHistory } from "../history";
import {
  _internalApiGetCurrentContext,
  _internalApiGetProviderBrick,
  RuntimeBrick,
  _internalApiGetStoryboardContextWrapper,
} from "../core/exports";
import { getUrlBySegueFactory } from "./segue";
import { looseCheckIf, IfContainer } from "../checkIf";
import { getUrlByAliasFactory } from "./alias";
import { getMessageDispatcher } from "../core/MessageDispatcher";
import { PluginWebSocketMessageTopic } from "../websocket/interfaces";
import { applyTheme, applyMode } from "../themeAndMode";
import { clearMenuTitleCache, clearMenuCache } from "./menu";
import { PollableCallback, startPoll } from "./poll";
import { getArgsOfCustomApi } from "../core/FlowApi";
import { getRuntime } from "../runtime";
import {
  CustomTemplateContext,
  getCustomTemplateContext,
} from "../core/CustomTemplates/CustomTemplateContext";
import React from "react";
import { ArgsProps } from "antd/lib/message";

export function bindListeners(
  brick: HTMLElement,
  eventsMap: BrickEventsMap,
  context: PluginRuntimeContext
): void {
  Object.entries(eventsMap).forEach(([eventType, handlers]) => {
    [].concat(handlers).forEach((handler: BrickEventHandler) => {
      const listener = listenerFactory(handler, context, { element: brick });
      brick.addEventListener(eventType, listener);
      rememberListeners(brick, eventType, listener, handler);
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
  listener: EventListener,
  handler: BrickEventHandler
): void {
  if (!brick.$$eventListeners) {
    brick.$$eventListeners = [];
  }
  brick.$$eventListeners.push([eventType, listener, handler]);
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
  handler: BrickEventHandler,
  context: PluginRuntimeContext,
  runtimeBrick: RuntimeBrick
): EventListener {
  if (isBuiltinHandler(handler)) {
    const method = handler.action.split(".")[1] as any;
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
        return builtinHistoryListenerFactory(
          method,
          handler.args,
          handler,
          handler.callback,
          context
        );
      case "segue.push":
      case "segue.replace":
        return builtinSegueListenerFactory(
          method,
          handler.args,
          handler,
          handler.callback,
          context
        );
      case "alias.push":
      case "alias.replace":
        return builtinAliasListenerFactory(
          method,
          handler.args,
          handler,
          context
        );
      case "legacy.go":
        return builtinIframeListenerFactory(handler.args, handler, context);
      case "window.open":
        return builtinWindowListenerFactory(handler.args, handler, context);
      case "location.reload":
      case "location.assign":
        return builtinLocationListenerFactory(
          method,
          handler.args,
          handler,
          context
        );
      case "localStorage.setItem":
      case "localStorage.removeItem":
        return builtinWebStorageListenerFactory(
          "local",
          method,
          handler.args,
          handler,
          context
        );
      case "sessionStorage.setItem":
      case "sessionStorage.removeItem":
        return builtinWebStorageListenerFactory(
          "session",
          method,
          handler.args,
          handler,
          context
        );
      case "event.preventDefault":
        return ((event: CustomEvent) => {
          if (!looseCheckIf(handler, { ...context, event })) {
            return;
          }
          event.preventDefault();
        }) as EventListener;
      case "console.log":
      case "console.error":
      case "console.warn":
      case "console.info":
        return builtinConsoleListenerFactory(
          method,
          handler.args,
          handler,
          context
        );
      case "message.success":
      case "message.error":
      case "message.info":
      case "message.warn":
        return builtinMessageListenerFactory(
          method,
          handler.args,
          handler,
          context
        );
      case "handleHttpError":
        return ((event: CustomEvent) => {
          if (!looseCheckIf(handler, { ...context, event })) {
            return;
          }
          handleHttpError(event.detail);
        }) as EventListener;
      case "context.assign":
      case "context.replace":
      case "context.refresh":
      case "context.load":
        return builtinContextListenerFactory(
          method,
          handler.args,
          handler,
          handler.callback,
          context
        );
      case "state.update":
      case "state.refresh":
      case "state.load":
        return builtinStateListenerFactory(
          method,
          handler.args,
          handler,
          handler.callback,
          context
        );
      case "tpl.dispatchEvent":
        return builtinTplDispatchEventFactory(handler.args, handler, context);
      case "message.subscribe":
      case "message.unsubscribe":
        return builtinWebSocketListenerFactory(
          runtimeBrick,
          method,
          handler.args,
          handler,
          handler.callback,
          context
        );
      case "theme.setDarkTheme":
      case "theme.setLightTheme":
        return ((event: CustomEvent) => {
          if (!looseCheckIf(handler, { ...context, event })) {
            return;
          }
          applyTheme(
            handler.action === "theme.setDarkTheme" ? "dark" : "light"
          );
        }) as EventListener;
      case "theme.setTheme":
        return builtinThemeListenerFactory(handler.args, handler, context);
      case "mode.setDashboardMode":
      case "mode.setDefaultMode":
        return ((event: CustomEvent) => {
          if (!looseCheckIf(handler, { ...context, event })) {
            return;
          }
          applyMode(
            handler.action === "mode.setDashboardMode" ? "dashboard" : "default"
          );
        }) as EventListener;
      case "menu.clearMenuTitleCache":
        return ((event: CustomEvent) => {
          if (!looseCheckIf(handler, { ...context, event })) {
            return;
          }
          clearMenuTitleCache();
        }) as EventListener;
      case "menu.clearMenuCache":
        return ((event: CustomEvent) => {
          if (!looseCheckIf(handler, { ...context, event })) {
            return;
          }
          clearMenuCache();
        }) as EventListener;
      case "analytics.event":
        return builtinAnalyticsListenerFactory(handler.args, handler, context);

      case "preview.debug":
        return builtinFormDebugListenerFactory(handler.args, handler, context);
      default:
        return () => {
          // eslint-disable-next-line no-console
          console.error("unknown event listener action:", handler.action);
        };
    }
  }

  if (isUseProviderHandler(handler)) {
    return usingProviderFactory(handler, context, runtimeBrick);
  }

  if (isCustomHandler(handler)) {
    return customListenerFactory(handler, handler, context, runtimeBrick);
  }
}

function usingProviderFactory(
  handler: UseProviderEventHandler,
  context: PluginRuntimeContext,
  runtimeBrick: RuntimeBrick
): EventListener {
  return async function (event: CustomEvent): Promise<void> {
    if (!looseCheckIf(handler, { ...context, event })) {
      return;
    }
    try {
      const providerBrick = await _internalApiGetProviderBrick(
        handler.useProvider
      );
      const method = handler.method !== "saveAs" ? "resolve" : "saveAs";
      brickCallback(
        providerBrick,
        handler,
        method,
        context,
        runtimeBrick,
        event
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(httpErrorToString(error));
    }
  } as unknown as EventListener;
}

function getTplContext(tplContextId: string): CustomTemplateContext {
  // istanbul ignore if
  if (!tplContextId) {
    throw new Error("Calling tpl but no tplContextId was found in context!");
  }
  return getCustomTemplateContext(tplContextId);
}

function builtinTplDispatchEventFactory(
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const tpl = getTplContext(context.tplContextId).getBrick().element;
    const [type, init] = argsFactory(args, context, event) as [
      string,
      CustomEventInit
    ];
    tpl.dispatchEvent(new CustomEvent(type, init));
  } as EventListener;
}

function builtinContextListenerFactory(
  method: "assign" | "replace" | "refresh" | "load",
  args: unknown[],
  ifContainer: IfContainer,
  callback: BrickEventHandlerCallback,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const storyboardContext = _internalApiGetStoryboardContextWrapper();
    const [name, value] = argsFactory(args, context, event);
    storyboardContext.updateValue(name as string, value, method, callback);
  } as EventListener;
}

function builtinStateListenerFactory(
  method: "update" | "refresh" | "load",
  args: unknown[],
  ifContainer: IfContainer,
  callback: BrickEventHandlerCallback,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const tplContext = getTplContext(context.tplContextId);
    const [name, value] = argsFactory(args, context, event);
    tplContext.state.updateValue(
      name as string,
      value,
      method === "update" ? "replace" : method,
      callback
    );
  } as EventListener;
}

function builtinLocationListenerFactory(
  method: "assign" | "reload",
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    if (method === "assign") {
      const [url] = argsFactory(args, context, event) as [string];
      location.assign(url);
    } else {
      location[method]();
    }
  } as EventListener;
}

function builtinSegueListenerFactory(
  method: "push" | "replace",
  args: unknown[],
  ifContainer: IfContainer,
  callback: BrickEventHandlerCallback,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const { app, segues } = _internalApiGetCurrentContext();
    getHistory()[method](
      getUrlBySegueFactory(
        app,
        segues
      )(
        ...(argsFactory(args, context, event) as Parameters<
          ReturnType<typeof getUrlBySegueFactory>
        >)
      ),
      undefined,
      callback
        ? (blocked) => {
            const callbackFactory = eventCallbackFactory(
              callback,
              () => context,
              null
            );
            callbackFactory(blocked ? "error" : "success")({ blocked });
            callbackFactory("finally")({ blocked });
          }
        : undefined
    );
  } as EventListener;
}

function builtinAliasListenerFactory(
  method: "push" | "replace",
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const { app } = _internalApiGetCurrentContext();
    getHistory()[method](
      getUrlByAliasFactory(app)(
        ...(argsFactory(args, context, event) as Parameters<
          ReturnType<typeof getUrlByAliasFactory>
        >)
      )
    );
  } as EventListener;
}

function builtinWebSocketListenerFactory(
  runtimeBrick: RuntimeBrick,
  method: "subscribe" | "unsubscribe",
  args: any[],
  ifContainer: IfContainer,
  callback: BrickEventHandlerCallback,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }

    const [channel, messageTopic] = argsFactory(args, context, event) as [
      string,
      PluginWebSocketMessageTopic
    ];

    const { system, topic } = messageTopic || {};
    getMessageDispatcher()[method](
      channel,
      { system, topic },
      { ...callback, runtimeBrick, context }
    );
  } as EventListener;
}

function builtinIframeListenerFactory(
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
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
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const [url] = argsFactory(args, context, event) as [string];
    postMessage(url);
  } as EventListener;
}

function builtinWindowListenerFactory(
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const [url, target, features] = argsFactory(args, context, event) as [
      string,
      string,
      string
    ];
    window.open(url, target || "_self", features);
  } as EventListener;
}

function builtinAnalyticsListenerFactory(
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const [action, data] = argsFactory(args, context, event) as [
      string,
      Record<string, unknown>
    ];
    const runtime = getRuntime();
    userAnalytics.event(action, {
      micro_app_id: runtime.getCurrentApp()?.id,
      route_alias: runtime.getCurrentRoute()?.alias,
      ...data,
    });
  } as EventListener;
}

function builtinThemeListenerFactory(
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const [theme] = argsFactory(args, context, event);
    applyTheme(theme as SiteTheme);
  } as EventListener;
}

function customListenerFactory(
  handler: CustomBrickEventHandler,
  ifContainer: IfContainer,
  context: PluginRuntimeContext,
  runtimeBrick: RuntimeBrick
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    let targets: HTMLElement[] = [];
    if (typeof handler.target === "string") {
      if (handler.target === "_self") {
        targets.push(runtimeBrick.element);
      } else if (handler.multiple) {
        targets = Array.from(document.querySelectorAll(handler.target));
      } else {
        const found = document.querySelector(handler.target) as HTMLElement;
        if (found !== null) {
          targets.push(found);
        }
      }
    } else if (handler.target) {
      targets.push(handler.target as HTMLElement);
    } else if (handler.targetRef) {
      const tpl: RuntimeBrickElement = getTplContext(
        context.tplContextId
      ).getBrick().element;
      targets.push(
        ...[]
          .concat(handler.targetRef)
          .map((ref) => tpl.$$getElementByRef?.(ref))
          .filter(Boolean)
      );
    }
    if (targets.length === 0) {
      // eslint-disable-next-line no-console
      console.error("target not found:", handler.target || handler.targetRef);
      return;
    }
    if (isExecuteCustomHandler(handler)) {
      targets.forEach((target) => {
        brickCallback(
          target,
          handler,
          handler.method,
          context,
          runtimeBrick,
          event,
          {
            useEventAsDefault: true,
          }
        );
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

export function eventCallbackFactory(
  callback: BrickEventHandlerCallback,
  getContext: () => PluginRuntimeContext,
  runtimeBrick: RuntimeBrick
) {
  return function callbackFactory(
    type: "success" | "error" | "finally" | "progress"
  ) {
    return function (result?: unknown) {
      if (callback?.[type]) {
        try {
          const event = new CustomEvent(`callback.${type}`, {
            detail: result,
          });
          const context = getContext();
          [].concat(callback[type]).forEach((eachHandler) => {
            listenerFactory(eachHandler, context, runtimeBrick)(event);
          });
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

async function brickCallback(
  target: HTMLElement,
  handler: ExecuteCustomBrickEventHandler | UseProviderEventHandler,
  method: string,
  context: PluginRuntimeContext,
  runtimeBrick: RuntimeBrick,
  event: CustomEvent,
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
    let computedArgs = argsFactory(handler.args, context, event, options);
    if (isUseProviderHandler(handler)) {
      computedArgs = await getArgsOfCustomApi(
        handler.useProvider,
        computedArgs
      );
    }
    return (target as any)[method](...computedArgs);
  };

  if (!handler.callback) {
    task();
    return;
  }

  const callbackFactory = eventCallbackFactory(
    handler.callback,
    () => context,
    runtimeBrick
  );

  const pollableCallback: Required<PollableCallback> = {
    progress: callbackFactory("progress"),
    success: callbackFactory("success"),
    error: callbackFactory("error"),
    finally: callbackFactory("finally"),
  };

  let poll: ProviderPollOptions;
  if (isUseProviderHandler(handler)) {
    poll = computeRealValue(handler.poll, { ...context, event }, true);
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

function builtinHistoryListenerFactory(
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
  args: unknown[],
  ifContainer: IfContainer,
  callback: BrickEventHandlerCallback,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
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
      computedArgs = argsFactory(args, context, event, {
        useEventDetailAsDefault: true,
      });
      computedArgs.length = baseArgsLength;
    }
    if (hasCallback && callback) {
      const callbackFactory = eventCallbackFactory(
        callback,
        () => context,
        null
      );
      computedArgs.push((blocked: boolean) => {
        callbackFactory(blocked ? "error" : "success")({ blocked });
        callbackFactory("finally")({ blocked });
      });
    }
    (getHistory()[overrideMethod] as (...args: unknown[]) => unknown)(
      ...computedArgs
    );
  } as EventListener;
}

function builtinConsoleListenerFactory(
  method: "log" | "error" | "warn" | "info",
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    // eslint-disable-next-line no-console
    console[method](
      ...argsFactory(args, context, event, {
        useEventAsDefault: true,
      })
    );
  } as EventListener;
}

function builtinMessageListenerFactory(
  method: "success" | "error" | "info" | "warn",
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent) {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const processArg = argsFactory(args, context, event) as Parameters<
      typeof message["success"]
    >;
    const contentNode = React.createElement(
      "span",
      null,
      `${processArg[0]}`
    ) as React.ReactNode;
    const argProp = {
      content: contentNode,
      className: `ant-message-notice-${method}`,
    } as ArgsProps;
    processArg[0] = argProp;
    message[method](...processArg);
  } as EventListener;
}

function builtinWebStorageListenerFactory(
  storageType: "local" | "session",
  method: "setItem" | "removeItem",
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent) {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    const storage = storageType === "local" ? localStorage : sessionStorage;
    const [name, value] = argsFactory(args, context, event);
    if (method === "setItem") {
      if (value !== undefined) {
        storage.setItem(name as string, JSON.stringify(value));
      }
    } else if (method === "removeItem") {
      storage.removeItem(name as string);
    }
  } as EventListener;
}

function builtinFormDebugListenerFactory(
  args: unknown[],
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): EventListener {
  return function (event: CustomEvent): void {
    if (!looseCheckIf(ifContainer, { ...context, event })) {
      return;
    }
    window.parent.postMessage({
      sender: "previewer",
      type: "preview.debug",
      res: argsFactory(args, context, event),
    });
  } as EventListener;
}

interface ArgsFactoryOptions {
  useEventAsDefault?: boolean;
  useEventDetailAsDefault?: boolean;
}

function argsFactory(
  args: unknown[],
  context: PluginRuntimeContext,
  event: CustomEvent,
  options: ArgsFactoryOptions = {}
): unknown[] {
  return Array.isArray(args)
    ? (computeRealValue(
        args,
        {
          ...context,
          event,
        },
        true
      ) as unknown[])
    : options.useEventAsDefault
    ? [event]
    : options.useEventDetailAsDefault
    ? [event.detail]
    : [];
}
