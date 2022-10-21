import type {
  BrickConf,
  BrickEventHandler,
  BrickEventsMap,
  BrickLifeCycle,
  ContextConf,
  CustomTemplateConstructor,
  FeatureFlags,
  MessageConf,
  RouteConf,
  RouteConfOfBricks,
  RuntimeStoryboard,
  ScrollIntoViewConf,
  UseProviderEventHandler,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import {
  cook,
  EstreeLiteral,
  EstreeNode,
  isEvaluable,
  preevaluate,
} from "@next-core/cook";
import { pull } from "lodash";
import { hasOwnProperty } from "./hasOwnProperty";
import { isObject } from "./isObject";

export interface RemoveDeadConditionsOptions {
  constantFeatureFlags?: boolean;
  featureFlags?: FeatureFlags;
}

/**
 * Remove dead conditions in storyboard like `if: '<% FLAGS["your-feature-flag"] %>'` when
 * `FLAGS["your-feature-flag"]` is falsy.
 */
export function removeDeadConditions(
  storyboard: RuntimeStoryboard,
  options?: RemoveDeadConditionsOptions
): void {
  if (storyboard.$$deadConditionsRemoved) {
    return;
  }
  removeDeadConditionsInRoutes(storyboard.routes, options);
  const { customTemplates } = storyboard.meta ?? {};
  if (Array.isArray(customTemplates)) {
    for (const tpl of customTemplates) {
      removeDeadConditionsInTpl(tpl, options);
    }
  }
  storyboard.$$deadConditionsRemoved = true;
}

/**
 * Like `removeDeadConditions` but applied to a custom template.
 */
export function removeDeadConditionsInTpl(
  tplConstructor: CustomTemplateConstructor,
  options?: RemoveDeadConditionsOptions
): void {
  removeDeadConditionsInBricks(tplConstructor.bricks, options);
}

function removeDeadConditionsInRoutes(
  routes: RouteConf[],
  options: RemoveDeadConditionsOptions
): void {
  removeDeadConditionsInArray(routes, options, (route) => {
    removeDeadConditionsInContext(route.context, options);
    if (route.type === "routes") {
      removeDeadConditionsInRoutes(route.routes, options);
    } else {
      removeDeadConditionsInBricks(
        (route as RouteConfOfBricks).bricks,
        options
      );
    }
  });
}

function removeDeadConditionsInBricks(
  bricks: BrickConf[],
  options: RemoveDeadConditionsOptions
): void {
  removeDeadConditionsInArray(bricks, options, (brick) => {
    if (brick.slots) {
      for (const slot of Object.values(brick.slots)) {
        if (slot.type === "routes") {
          removeDeadConditionsInRoutes(slot.routes, options);
        } else {
          removeDeadConditionsInBricks(slot.bricks, options);
        }
      }
    }
    removeDeadConditionsInLifeCycle(brick.lifeCycle, options);
    removeDeadConditionsInEvents(brick.events, options);
    removeDeadConditionsInContext(brick.context, options);
    removeDeadConditionsInProperties(brick.properties, options);
  });
}

function removeDeadConditionsInProperties(
  value: unknown,
  options: RemoveDeadConditionsOptions
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      removeDeadConditionsInProperties(item, options);
    }
  } else if (isObject(value)) {
    if (value.useBrick) {
      if (Array.isArray(value.useBrick)) {
        // For useBrick as array, just remove dead items.
        removeDeadConditionsInArray(value.useBrick, options, (useBrick) => {
          removeDeadConditionsInUseBrick(
            useBrick as UseSingleBrickConf,
            options
          );
        });
      } else {
        // For useBrick as single one, we have to keep it,
        // and we change it to an empty <div>.
        computeConstantCondition(value.useBrick, options);
        if (value.useBrick.if === false) {
          value.useBrick = {
            brick: "div",
            if: false,
          };
        } else {
          removeDeadConditionsInUseBrick(
            value.useBrick as UseSingleBrickConf,
            options
          );
        }
      }
    } else {
      for (const item of Object.values(value)) {
        removeDeadConditionsInProperties(item, options);
      }
    }
  }
}

function removeDeadConditionsInUseBrick(
  useBrick: UseSingleBrickConf,
  options: RemoveDeadConditionsOptions
): void {
  removeDeadConditionsInProperties(useBrick.properties, options);
  removeDeadConditionsInEvents(useBrick.events, options);
  if (useBrick.slots) {
    for (const slot of Object.values(useBrick.slots)) {
      removeDeadConditionsInBricks(slot.bricks as BrickConf[], options);
    }
  }
}

function removeDeadConditionsInEvents(
  events: BrickEventsMap,
  options: RemoveDeadConditionsOptions
): void {
  if (isObject(events)) {
    for (const eventType of Object.keys(events)) {
      removeDeadConditionsInEvent(events, eventType, options);
    }
  }
}

function removeDeadConditionsInEvent<
  T extends string,
  P extends Partial<Record<T, BrickEventHandler | BrickEventHandler[]>>
>(events: P, eventType: T, options: RemoveDeadConditionsOptions): void {
  const handlers = events[eventType];
  if (!handlers) {
    return;
  }
  if (Array.isArray(handlers)) {
    removeDeadConditionsInArray(handlers, options, (handler) => {
      if ((handler as UseProviderEventHandler).callback) {
        removeDeadConditionsInEvents(
          (handler as UseProviderEventHandler).callback as BrickEventsMap,
          options
        );
      }
    });
  } else {
    computeConstantCondition(handlers, options);
    if (handlers.if === false) {
      delete events[eventType];
      return;
    }
    if ((handlers as UseProviderEventHandler).callback) {
      removeDeadConditionsInEvents(
        (handlers as UseProviderEventHandler).callback as BrickEventsMap,
        options
      );
    }
  }
}

function removeDeadConditionsInContext(
  context: ContextConf[],
  options: RemoveDeadConditionsOptions
): void {
  removeDeadConditionsInArray(context, options);
}

function removeDeadConditionsInArray<T extends IfContainer>(
  list: T[],
  options: RemoveDeadConditionsOptions,
  callback?: (item: T) => void
): void {
  if (Array.isArray(list)) {
    const removes: T[] = [];
    for (const item of list) {
      computeConstantCondition(item, options);
      if (item.if === false) {
        removes.push(item);
        continue;
      }
      callback?.(item);
    }
    pull(list, ...removes);
  }
}

function removeDeadConditionsInLifeCycle(
  lifeCycle: BrickLifeCycle,
  options: RemoveDeadConditionsOptions
): void {
  if (lifeCycle) {
    removeDeadConditionsInArray(lifeCycle.useResolves, options);

    for (const key of [
      "onPageLoad",
      "onPageLeave",
      "onAnchorLoad",
      "onAnchorUnload",
      "onMessageClose",
      "onBeforePageLoad",
      "onBeforePageLeave",
      "onMediaChange",
    ] as const) {
      removeDeadConditionsInEvent(lifeCycle, key, options);
    }
    for (const key of ["onMessage", "onScrollIntoView"] as const) {
      for (const withHandlers of (
        [] as (MessageConf | ScrollIntoViewConf)[]
      ).concat(lifeCycle[key])) {
        if (withHandlers) {
          removeDeadConditionsInEvent(withHandlers, "handlers", options);
        }
      }
    }
  }
}

export interface IfContainer {
  if?: unknown;
}

export function computeConstantCondition(
  ifContainer: IfContainer,
  options: RemoveDeadConditionsOptions = {}
): void {
  if (hasOwnProperty(ifContainer, "if")) {
    if (typeof ifContainer.if === "string" && isEvaluable(ifContainer.if)) {
      try {
        const { expression, attemptToVisitGlobals, source } = preevaluate(
          ifContainer.if
        );
        let hasOtherThanFlags = false;
        for (const item of attemptToVisitGlobals) {
          if (item !== "undefined" && item !== "FLAGS") {
            hasOtherThanFlags = true;
            break;
          }
        }
        if (hasOtherThanFlags) {
          if (isConstantLogical(expression, false, options)) {
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.warn("[removed dead if]:", ifContainer.if, ifContainer);
            }
            ifContainer.if = false;
          }
          return;
        }
        const { constantFeatureFlags, featureFlags } = options;
        if (constantFeatureFlags) {
          const originalIf = ifContainer.if;
          ifContainer.if = !!cook(expression, source, {
            globalVariables: {
              undefined: undefined,
              FLAGS: featureFlags,
            },
          });
          if (
            process.env.NODE_ENV === "development" &&
            ifContainer.if === false
          ) {
            // eslint-disable-next-line no-console
            console.warn("[removed dead if]:", originalIf, ifContainer);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Parse storyboard expression failed:", error);
      }
    } else if (!ifContainer.if && ifContainer.if !== false) {
      // eslint-disable-next-line no-console
      console.warn(
        "[potential dead if]:",
        typeof ifContainer.if,
        ifContainer.if,
        ifContainer
      );
    }
  }
}

/**
 * We can safely remove the code for the following use cases,
 * even though they contain runtime variables such as CTX:
 *
 * - if: '<% false && CTX.any %>'
 * - if: '<% FLAGS["disabled"] && CTX.any %>'
 * - if: '<% !FLAGS["enabled"] && CTX.any %>'
 * - if: '<% !(FLAGS["enabled"] || CTX.any) %>'
 *
 * Since these logics will always get a falsy result.
 *
 * Here we simply only consider these kinds of AST node:
 *
 * - LogicalExpression: with operator of '||' or '&&'
 * - UnaryExpression: with operator of '!'
 * - Literal: such as boolean/number/string/null/regex
 * - MemberExpression: of 'FLAGS["disabled"]' or 'FLAGS.disabled'
 * - Identifier: of 'undefined'
 */
function isConstantLogical(
  node: EstreeNode,
  expect: boolean,
  options: RemoveDeadConditionsOptions
): boolean {
  const { constantFeatureFlags, featureFlags } = options;
  return node.type === "LogicalExpression"
    ? node.operator === (expect ? "||" : "&&") &&
        [node.left, node.right].some((item) =>
          isConstantLogical(item, expect, options)
        )
    : node.type === "UnaryExpression"
    ? node.operator === "!" &&
      isConstantLogical(node.argument, !expect, options)
    : (node as unknown as EstreeLiteral).type === "Literal"
    ? !!(node as unknown as EstreeLiteral).value === expect
    : node.type === "Identifier"
    ? node.name === "undefined"
      ? !expect
      : false
    : constantFeatureFlags &&
      node.type === "MemberExpression" &&
      node.object.type === "Identifier" &&
      node.object.name === "FLAGS" &&
      (node.computed
        ? (node.property as unknown as EstreeLiteral).type === "Literal" &&
          typeof (node.property as unknown as EstreeLiteral).value ===
            "string" &&
          !!featureFlags[
            (node.property as unknown as EstreeLiteral).value as string
          ] === expect
        : node.property.type === "Identifier" &&
          !!featureFlags[node.property.name] === expect);
}
