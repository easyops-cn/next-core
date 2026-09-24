import type {
  BrickConf,
  BrickEventHandler,
  BrickEventsMap,
  BuiltinBrickEventHandler,
  RouteConfOfBricks,
  RuntimeStoryboard,
  Storyboard,
} from "@next-core/types";
import { isEvaluable } from "@next-core/cook";
import { hasOwnProperty } from "@next-core/utils/general";
import {
  parseStoryboard,
  traverse,
  parseEvents,
  type StoryboardNodeEvent,
  type StoryboardNodeRoute,
} from "@next-core/utils/storyboard";
import { uniqueId } from "lodash";
import { hooks } from "./Runtime.js";
import { registerAppI18n } from "./registerAppI18n.js";
import { isBuiltinHandler, isCustomHandler } from "./bindListeners.js";

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
  // initializeSeguesForRoutes(storyboard.routes);
  initializeSegues(storyboard);
  Object.assign(storyboard, {
    $$fulfilled: true,
    $$fulfilling: null,
  });
}

type SceneConf = Pick<BrickConf, "properties" | "events">;

interface SegueConf {
  type: "drawer" | "modal";
  route?: {
    path: string;
    params: Record<string, string>;
  };
  modal?: SceneConf;
  scene?: SceneConf;
}

function initializeSegues(storyboard: Storyboard) {
  const ast = parseStoryboard(storyboard);

  traverse(ast, (node, nodePath) => {
    switch (node.type) {
      case "EventHandler":
        if (isBuiltinHandler(node.raw) && node.raw.action === "segue.go") {
          const parent = nodePath[nodePath.length - 1] as StoryboardNodeEvent;
          const routeParent = (
            nodePath.findLast(
              (node) => node.type === "Route" && node.raw.type === "bricks"
            ) as StoryboardNodeRoute
          ).raw as RouteConfOfBricks;
          if (typeof node.rawKey === "number") {
            replaceSegues(
              node.raw,
              parent.rawContainer[parent.rawKey] as BrickEventHandler[],
              node.rawKey,
              routeParent
            );
          } else {
            replaceSegues(
              node.raw,
              parent.rawContainer,
              parent.rawKey,
              routeParent
            );
          }
        }
        break;
    }
  });
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
    switch (segueConf.type) {
      case "drawer": {
        if (segueConf.route) {
          const { params, path } = segueConf.route;
          const targetUrlExpr = path.replace(/:(\w+)/g, (_, k) => {
            const hasParam = hasOwnProperty(params, k);
            const paramValue = hasParam ? params[k] : undefined;
            return hasParam
              ? typeof paramValue === "string" && isEvaluable(paramValue)
                ? `\${${paramValue.replace(/^\s*<%[~=]?\s|\s%>\s*$/g, "")}}`
                : String(paramValue).replace(/[`\\]/g, "\\$&")
              : `\${PATH.${k}}`;
          });
          (handlers as BrickEventsMap)[key] = {
            action: "history.push",
            args: [`<% \`${targetUrlExpr}\` %>`],
          };
          const drawerId = uniqueId("internal-segue-drawer-");
          const drawerTarget = `#${drawerId}`;
          routeParent.bricks.push({
            brick: "eo-drawer",
            iid: drawerId,
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
                          Object.keys(params).map((k) => [k, `<% PATH.${k} %>`])
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

        const replacements = new Map<string, string>([
          ["_modal", modalTarget],
          ["_scene", sceneTarget],
        ]);
        replaceSceneTarget(segueConf.modal?.events, replacements);
        replaceSceneTarget(segueConf.scene?.events, replacements);

        routeParent.bricks.push({
          brick: "eo-modal",
          iid: modalId,
          portal: true,
          properties: {
            closeWhenConfirm: false,
            ...segueConf.modal?.properties,
            id: modalId,
          },
          events: segueConf.modal?.events,
          children: [
            {
              brick: segueTarget,
              iid: sceneId,
              properties: {
                ...segueConf.scene?.properties,
                id: sceneId,
              },
              events: segueConf.scene?.events,
            },
          ],
        });
        break;
      }
    }
  }
}

function replaceSceneTarget(
  events: BrickEventsMap | undefined,
  replacements: Map<string, string>
) {
  const ast = parseEvents(events);

  traverse(ast, (node) => {
    switch (node.type) {
      case "EventHandler":
        if (isCustomHandler(node.raw) && typeof node.raw.target === "string") {
          const replacement = replacements.get(node.raw.target);
          if (replacement !== undefined) {
            node.raw.target = replacement;
          }
        }
    }
  });
}
