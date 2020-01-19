import { Location } from "history";
import {
  BrickEventHandler,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  CustomBrickEventHandler,
  PluginHistory,
  PluginRuntimeContext,
  ExecuteCustomBrickEventHandler,
  SetPropsCustomBrickEventHandler
} from "@easyops/brick-types";
import { computeRealValue, setProperties } from "./setProperties";
import { isNil, forEach } from "lodash";
import { isObject } from "./isObject";

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

export const bindListeners = (
  brick: HTMLElement,
  eventsMap: BrickEventsMap,
  history: PluginHistory,
  context?: PluginRuntimeContext
): void => {
  Object.entries(eventsMap).forEach(([eventType, handlers]) => {
    [].concat(handlers).forEach(handler => {
      const hasArgs = Array.isArray(handler.args);
      if (isBuiltinHandler(handler)) {
        switch (handler.action) {
          case "history.push":
          case "history.replace":
            brick.addEventListener(eventType, ((event: CustomEvent) => {
              const [, method] = handler.action.split(".") as [
                "history",
                "push" | "replace"
              ];
              if (hasArgs) {
                history[method](
                  ...(computeRealValue(
                    handler.args,
                    {
                      ...context,
                      event
                    },
                    true
                  ) as [Location])
                );
              } else {
                history[method](event.detail as Location);
              }
            }) as EventListener);
            break;
          case "history.pushQuery":
          case "history.replaceQuery":
            brick.addEventListener(eventType, ((event: CustomEvent) => {
              const method =
                handler.action === "history.pushQuery" ? "push" : "replace";
              const urlSearchParams = new URLSearchParams(
                history.location.search
              );
              const assignArgs = {};
              if (hasArgs || isObject(event.detail)) {
                const realArgs = hasArgs
                  ? computeRealValue(
                      handler.args,
                      {
                        ...context,
                        event
                      },
                      true
                    )
                  : [event.detail];
                const extraQuery =
                  hasArgs && realArgs[1] ? realArgs[1].extraQuery : {};
                Object.assign(assignArgs, realArgs[0], extraQuery);
                forEach(assignArgs, (v, k) => {
                  if (isNil(v) || v === "") {
                    urlSearchParams.delete(k);
                  } else {
                    urlSearchParams.set(k, v);
                  }
                });
                history[method](`?${urlSearchParams.toString()}`);
              }
            }) as EventListener);
            break;
          case "history.goBack":
          case "history.goForward":
            brick.addEventListener(eventType, ((event: CustomEvent) => {
              const [, method] = handler.action.split(".") as [
                "history",
                "goBack" | "goForward"
              ];
              history[method]();
            }) as EventListener);
            break;
          case "location.reload":
            brick.addEventListener(eventType, ((event: CustomEvent) => {
              location.reload();
            }) as EventListener);
            break;
          case "console.log":
          case "console.error":
          case "console.warn":
          case "console.info":
            brick.addEventListener(eventType, ((event: CustomEvent) => {
              const [, method] = handler.action.split(".") as [
                "console",
                "log" | "error" | "warn" | "info"
              ];
              if (hasArgs) {
                // eslint-disable-next-line no-console
                console[method](
                  ...computeRealValue(
                    handler.args,
                    {
                      ...context,
                      event
                    },
                    true
                  )
                );
              } else {
                // eslint-disable-next-line no-console
                console[method](event);
              }
            }) as EventListener);
            break;
          default:
            /*global process*/
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.warn("unknown event listener action:", handler.action);
            }
        }
      } else if (isCustomHandler(handler)) {
        brick.addEventListener(eventType, ((event: CustomEvent) => {
          let targets: any[] = [];
          if (handler.multiple) {
            targets = Array.from(document.querySelectorAll(handler.target));
          } else {
            const found = document.querySelector(handler.target);
            if (found !== null) {
              targets.push(found);
            }
          }
          if (isExecuteCustomHandler(handler)) {
            targets.forEach(target => {
              if (typeof target[handler.method] === "function") {
                if (hasArgs) {
                  target[handler.method](
                    ...computeRealValue(
                      handler.args,
                      {
                        ...context,
                        event
                      },
                      true
                    )
                  );
                } else {
                  target[handler.method](event);
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
              handler.injectDeep
            );
          }
        }) as EventListener);
      }
    });
  });
};
