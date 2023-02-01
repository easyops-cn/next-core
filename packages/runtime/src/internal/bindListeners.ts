import type {
  BrickEventHandler,
  BrickEventsMap,
  BuiltinBrickEventHandler,
} from "@next-core/brick-types";
import { checkIf } from "./checkIf.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import { RuntimeContext } from "./RuntimeContext.js";
import { RuntimeBrick } from "./Transpiler.js";

type Listener = (this: HTMLElement, event: Event) => unknown;

export function bindListeners(
  brick: HTMLElement,
  eventsMap: BrickEventsMap,
  runtimeContext: RuntimeContext
): void {
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
  runtimeBrick: Partial<RuntimeBrick>
): Listener {
  return async function (event: Event): Promise<void> {
    for (const handler of ([] as BrickEventHandler[]).concat(handlers)) {
      const task = (async () => {
        if (!(await checkIf(handler, runtimeContext))) {
          return;
        }
        if (isBuiltinHandler(handler)) {
          const method = handler.action.split(".")[1] as any;
          switch (handler.action) {
            case "console.log":
              await handleConsoleAction(
                event,
                method,
                handler.args,
                runtimeContext
              );
              break;
            default:
              // eslint-disable-next-line no-console
              console.error("unknown event listener action:", handler.action);
          }
        } else {
          // eslint-disable-next-line no-console
          console.error("unknown event handler:", handler);
        }
      })();
      if (!handler.async) {
        await task;
      }
    }
  };
}

async function handleConsoleAction(
  event: Event,
  method: "log" | "error" | "warn" | "info",
  args: unknown[] | undefined,
  runtimeContext: RuntimeContext
) {
  // eslint-disable-next-line no-console
  console[method](
    ...(await argsFactory(args, runtimeContext, event, {
      useEventAsDefault: true,
    }))
  );
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
): Promise<unknown[]> | unknown[] {
  return Array.isArray(args)
    ? (computeRealValue(args, {
        ...runtimeContext,
        event,
      }) as Promise<unknown[]>)
    : options.useEventAsDefault
    ? [event]
    : options.useEventDetailAsDefault
    ? [(event as CustomEvent).detail]
    : [];
}
