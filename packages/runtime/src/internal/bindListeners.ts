import type {
  BrickEventHandler,
  BrickEventHandlerCallback,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  RuntimeContext,
} from "@next-core/brick-types";
import { checkIf } from "./compute/checkIf.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import { RuntimeBrick } from "./Transpiler.js";
import { getHistory } from "../history.js";

type Listener = (event: Event) => unknown;

export function bindListeners(
  brick: HTMLElement,
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
    // rememberListeners(brick, eventType, listener, handlers);
  });
}

export function isBuiltinHandler(
  handler: BrickEventHandler
): handler is BuiltinBrickEventHandler {
  return typeof (handler as BuiltinBrickEventHandler).action === "string";
}

export function listenerFactory(
  handlers: BrickEventHandler | BrickEventHandler[],
  runtimeContext: RuntimeContext,
  runtimeBrick?: Partial<RuntimeBrick>
): Listener {
  return function (event: Event): void {
    for (const handler of ([] as BrickEventHandler[]).concat(handlers)) {
      if (!checkIf(handler, runtimeContext)) {
        return;
      }
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
            return handleHistoryAction(
              event,
              method,
              handler.args,
              handler.callback,
              runtimeContext
            );

          case "console.log":
            return handleConsoleAction(
              event,
              method,
              handler.args,
              runtimeContext
            );

          case "context.assign":
          case "context.replace":
          case "context.refresh":
          case "context.load":
            return handleContextAction(
              event,
              method,
              handler.args,
              handler.callback,
              runtimeContext
            );

          default:
            // eslint-disable-next-line no-console
            console.error("unknown event listener action:", handler.action);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error("unknown event handler:", handler);
      }
    }
  };
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
    runtimeContext,
    callback
  );
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
  runtimeBrick?: RuntimeBrick
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
