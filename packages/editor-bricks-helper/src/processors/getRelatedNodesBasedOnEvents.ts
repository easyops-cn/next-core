import { BuilderRuntimeNode } from "../interfaces";
import {
  BrickEventHandler,
  ExecuteCustomBrickEventHandler,
  MessageConf,
} from "@next-core/brick-types";
import { isEmpty } from "lodash";

export type RelatedNodesBasedOnEventsMap = Map<
  number,
  {
    upstreamNodes: Set<number>;
    downstreamNodes: Set<number>;
  }
>;

export function getRelatedNodesBasedOnEvents(
  nodes: BuilderRuntimeNode[],
  rootNodeIsCustomTemplate?: boolean
): RelatedNodesBasedOnEventsMap {
  const nodesMap: RelatedNodesBasedOnEventsMap = new Map();

  const targetMap = new Map<string, number>();
  const targetRefMap = new Map<string, number>();
  for (const n of nodes) {
    nodesMap.set(n.$$uid, {
      upstreamNodes: new Set<number>(),
      downstreamNodes: new Set<number>(),
    });
    for (const selector of n.$$matchedSelectors) {
      if (!targetMap.get(selector)) {
        targetMap.set(selector, n.$$uid);
      }
    }
    if (rootNodeIsCustomTemplate) {
      if (n.ref) {
        targetRefMap.set(n.ref as string, n.$$uid);
      }
    }
  }

  for (const node of nodes) {
    let handlers: BrickEventHandler[] = [];
    if (!isEmpty(node.$$parsedEvents)) {
      handlers = Object.values(node.$$parsedEvents).flat();
    }
    if (!isEmpty(node.$$parsedLifeCycle)) {
      handlers = handlers.concat(
        Object.entries(node.$$parsedLifeCycle).flatMap(
          ([lifeCycleName, lifeCycleConf]) => {
            switch (lifeCycleName) {
              case "onBeforePageLoad":
              case "onPageLoad":
              case "onPageLeave":
              case "onBeforePageLeave":
              case "onAnchorLoad":
              case "onAnchorUnload":
              case "onMessageClose":
                return lifeCycleConf as BrickEventHandler[];
              case "onMessage":
                return ([] as MessageConf[])
                  .concat(lifeCycleConf)
                  .flatMap((messageConf) =>
                    ([] as BrickEventHandler[]).concat(messageConf.handlers)
                  );
              default:
                // eslint-disable-next-line no-console
                console.warn(`unknown lifeCycle: ${lifeCycleName}`);
                return [];
            }
          }
        )
      );
    }
    if (handlers.length > 0) {
      collectRelatedNodes(node, handlers, nodesMap, targetMap, targetRefMap);
    }
  }

  return nodesMap;
}

function collectRelatedNodes(
  node: BuilderRuntimeNode,
  handlers: BrickEventHandler[],
  nodesMap: RelatedNodesBasedOnEventsMap,
  targetMap: Map<string, number>,
  targetRefMap: Map<string, number>
): void {
  for (const handler of handlers as ExecuteCustomBrickEventHandler[]) {
    if (handler.target) {
      const targetNodeUid = targetMap.get(handler.target as string);
      if (targetNodeUid) {
        nodesMap.get(node.$$uid).downstreamNodes.add(targetNodeUid);
        nodesMap.get(targetNodeUid).upstreamNodes.add(node.$$uid);
      }
    } else if (handler.targetRef) {
      const targetRefNodeUid = targetRefMap.get(handler.targetRef);
      if (targetRefNodeUid) {
        nodesMap.get(node.$$uid).downstreamNodes.add(targetRefNodeUid);
        nodesMap.get(targetRefNodeUid).upstreamNodes.add(node.$$uid);
      }
    }
    if (handler.callback) {
      for (const [callbackType, callbackHandlers] of Object.entries(
        handler.callback
      )) {
        collectRelatedNodes(
          node,
          [].concat(callbackHandlers),
          nodesMap,
          targetMap,
          targetRefMap
        );
      }
    }
  }
}
