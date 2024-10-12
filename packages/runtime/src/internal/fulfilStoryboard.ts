import type {
  BrickConf,
  BrickEventHandler,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  RouteConf,
  RouteConfOfBricks,
  RuntimeStoryboard,
} from "@next-core/types";
import { isEvaluable } from "@next-core/cook";
import { uniqueId } from "lodash";
import { hooks } from "./Runtime.js";
import { registerAppI18n } from "./registerAppI18n.js";
import { isBuiltinHandler } from "./bindListeners.js";

export async function fulfilStoryboard(storyboard: RuntimeStoryboard) {
  if (storyboard.$$fulfilled) {
    return;
  }
  if (!storyboard.$$fulfilling) {
    storyboard.$$fulfilling = doFulfilStoryboard(storyboard);
  }
  return storyboard.$$fulfilling;
}

async function doFulfilStoryboard(storyboard: RuntimeStoryboard) {
  await hooks?.fulfilStoryboard?.(storyboard);
  registerAppI18n(storyboard);
  initializeSeguesForRoutes(storyboard.routes);
  Object.assign(storyboard, {
    $$fulfilled: true,
    $$fulfilling: null,
  });
}

interface SegueConf {
  by: "drawer" | "modal";
  route?: {
    path: string;
    params: SegueRouteParam[];
  };
  eventsMapping?: Record<string, string>;
  events?: BrickEventsMap;
}

interface SegueRouteParam {
  key: string;
  value: string;
}

function initializeSeguesForRoutes(routes: RouteConf[]) {
  for (const route of routes) {
    if (route.type !== "redirect" && route.type !== "routes") {
      initializeSeguesForBricks(route.bricks, route);
    }
  }
}

function initializeSeguesForBricks(
  bricks: BrickConf[],
  routeParent: RouteConfOfBricks
) {
  for (const brick of bricks) {
    if (brick.events) {
      for (const [eventType, handlers] of Object.entries(brick.events)) {
        if (Array.isArray(handlers)) {
          handlers.forEach((handler, index) => {
            if (isBuiltinHandler(handler) && handler.action === "segue.go") {
              replaceSegues(handler, handlers, index, routeParent);
            }
          });
        } else if (
          isBuiltinHandler(handlers) &&
          handlers.action === "segue.go"
        ) {
          replaceSegues(handlers, brick.events, eventType, routeParent);
        }
      }
    }

    if (brick.slots) {
      for (const slotConf of Object.values(brick.slots)) {
        if (slotConf.type === "routes") {
          initializeSeguesForRoutes(slotConf.routes);
        } else {
          initializeSeguesForBricks(slotConf.bricks, routeParent);
        }
      }
    } else if (Array.isArray(brick.children)) {
      initializeSeguesForBricks(brick.children, routeParent);
    }
  }
}

function replaceSegues(
  handler: BuiltinBrickEventHandler,
  handlers: BrickEventsMap | BrickEventHandler[],
  key: string | number,
  routeParent: RouteConfOfBricks
) {
  let segueConf: SegueConf | undefined;
  let segueTarget: string | undefined;
  if (
    Array.isArray(handler.args) &&
    ((segueTarget = handler.args[0] as string),
    typeof segueTarget === "string") &&
    (segueConf = handler.args[1] as SegueConf)
  ) {
    switch (segueConf.by) {
      case "drawer": {
        if (segueConf.route) {
          const { params, path } = segueConf.route;
          const targetUrlExpr = path.replace(/:(\w+)/g, (_, key) => {
            const param = params.find((param) => param.key === key);
            return param
              ? typeof param.value === "string" && isEvaluable(param.value)
                ? `\${${param.value.replace(/^\s*<%[~=]?\s|\s%>\s*$/g, "")}}`
                : String(param.value).replace(/[`\\]/g, "\\$&")
              : `\${PATH.${key}}`;
          });
          (handlers as BrickEventsMap)[key] = {
            action: "history.push",
            args: [`<% \`${targetUrlExpr}\` %>`],
          };
          const drawerId = uniqueId("internal-segue-drawer-");
          const drawerTarget = `#${drawerId}`;
          routeParent.bricks.push({
            brick: "eo-drawer",
            portal: true,
            properties: {
              id: drawerId,
              customTitle: "Detail",
            },
            events: {
              close: {
                action: "history.push",
                args: [
                  `<% \`${routeParent.path.replace(/:(\w+)/g, "${PATH.$1}")}\` %>`,
                ],
              },
            },
            slots: {
              "": {
                type: "routes",
                routes: [
                  {
                    path,
                    exact: true,
                    bricks: [
                      {
                        brick: segueTarget,
                        properties: Object.fromEntries(
                          params.map((param) => [
                            param.key,
                            `<% PATH.${param.key} %>`,
                          ])
                        ),
                        lifeCycle: {
                          onMount: {
                            target: drawerTarget,
                            method: "open",
                          },
                          onUnmount: {
                            target: drawerTarget,
                            method: "close",
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            },
          });
        }
        break;
      }

      case "modal": {
        const modalId = uniqueId("internal-segue-modal-");
        const modalTarget = `#${modalId}`;
        const sceneId = uniqueId("internal-segue-scene-");
        const sceneTarget = `#${sceneId}`;
        (handlers as BrickEventsMap)[key] = {
          target: modalTarget,
          method: "open",
        };
        routeParent.bricks.push({
          brick: "eo-modal",
          portal: true,
          properties: {
            id: modalId,
            modalTitle: "Create",
            closeWhenConfirm: false,
          },
          events: segueConf.eventsMapping
            ? Object.fromEntries(
                Object.entries(segueConf.eventsMapping).map(([from, to]) => [
                  from,
                  {
                    target: sceneTarget,
                    method: to,
                  },
                ])
              )
            : undefined,
          children: [
            {
              brick: segueTarget,
              properties: {
                id: sceneId,
              },
              events: segueConf.events,
            },
          ],
        });
        break;
      }
    }
  }
}
