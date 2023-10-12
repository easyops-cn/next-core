import type {
  ConditionalEventHandler,
  CustomTemplateConstructor,
  FeatureFlags,
  RuntimeStoryboard,
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
import {
  parseStoryboard,
  parseTemplate,
  traverse,
  type StoryboardNode,
  StoryboardNodeEventHandler,
} from "@next-core/storyboard";

export interface RemoveDeadConditionsOptions {
  constantFeatureFlags?: boolean;
  featureFlags?: FeatureFlags;
}

interface ConditionalStoryboardNode {
  raw: {
    if?: string | boolean;
  };
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
  const ast = parseStoryboard(storyboard);
  removeDeadConditionsByAst(ast, options);
  storyboard.$$deadConditionsRemoved = true;
}

function removeDeadConditionsByAst(
  ast: StoryboardNode,
  options: RemoveDeadConditionsOptions
): void {
  // First, we mark constant conditions.
  traverse(ast, (node) => {
    switch (node.type) {
      case "Route":
      case "Brick":
      case "EventHandler":
      case "Context":
        computeConstantCondition(node.raw, options);
        break;
      case "Resolvable":
        if (node.isConditional) {
          computeConstantCondition(node.raw, options);
        }
        break;
    }
  });

  // Then, we remove dead conditions accordingly.
  traverse(ast, (node) => {
    // let conditionalNodes: ConditionalStoryboardNode[];
    // let rawContainer: any;
    // let rawKey: string;
    // let deleteEmptyArray = false;
    // let isUseBrickEntry = false;
    // let keepConditionalHandlers = false;

    switch (node.type) {
      case "Root":
        shakeConditionalNodes(node.routes, node.raw, "routes");
        break;
      case "Template":
        shakeConditionalNodes(
          node.bricks as ConditionalStoryboardNode[],
          node.raw,
          "bricks"
        );
        break;
      case "Route":
      case "Slot":
        shakeConditionalNodes(
          node.children as ConditionalStoryboardNode[],
          node.raw,
          node.raw.type === "routes" ? "routes" : "bricks"
        );
        break;
      case "Event":
      case "EventCallback":
      case "SimpleLifeCycle":
      case "ConditionalEvent":
        shakeConditionalNodes(node.handlers, node.rawContainer, node.rawKey, {
          deleteEmptyArray: true,
          keepConditionalHandlers: true,
        });
        break;
      case "ResolveLifeCycle":
        shakeConditionalNodes(node.resolves, node.rawContainer, node.rawKey, {
          deleteEmptyArray: true,
        });
        break;
      case "UseBrickEntry":
        shakeConditionalNodes(
          node.children as ConditionalStoryboardNode[],
          node.rawContainer,
          node.rawKey,
          {
            isUseBrickEntry: true,
          }
        );
        break;
      case "EventHandler":
        shakeConditionalNodes(node.then, node.raw, "then");
        shakeConditionalNodes(node.else, node.raw, "else");
        break;
    }

    // Remove unreachable context/state.
    switch (node.type) {
      case "Route":
      case "Brick":
      case "Template":
        shakeConditionalNodes(
          node.context,
          node.raw,
          node.type === "Template" ? "state" : "context"
        );
    }
  });
}

function shakeConditionalNodes(
  conditionalNodes: ConditionalStoryboardNode[],
  rawContainer: any,
  rawKey: string,
  {
    deleteEmptyArray,
    isUseBrickEntry,
    keepConditionalHandlers,
  }: {
    deleteEmptyArray?: boolean;
    isUseBrickEntry?: boolean;
    keepConditionalHandlers?: boolean;
  } = {}
): void {
  const removedNodes: ConditionalStoryboardNode[] = [];
  if (Array.isArray(conditionalNodes)) {
    for (const node of conditionalNodes) {
      if (
        keepConditionalHandlers &&
        (node as StoryboardNodeEventHandler).else?.length
      ) {
        switch (node.raw.if) {
          case false:
            (node as StoryboardNodeEventHandler).then = (
              node as StoryboardNodeEventHandler
            ).else;
            (node as StoryboardNodeEventHandler).else = [];
            (node.raw as ConditionalEventHandler).then = (
              node.raw as ConditionalEventHandler
            ).else;
            delete (node.raw as ConditionalEventHandler).else;
            delete node.raw.if;
            continue;
          case true:
          case undefined:
            (node as StoryboardNodeEventHandler).else = [];
            delete (node.raw as ConditionalEventHandler).else;
            continue;
        }
      }
      if (node.raw.if === false) {
        removedNodes.push(node);
      }
    }
  }

  pull(conditionalNodes, ...removedNodes);

  if (removedNodes.length > 0) {
    if (isUseBrickEntry && !Array.isArray(rawContainer[rawKey])) {
      rawContainer[rawKey] = { brick: "div", if: false };
    } else if (isUseBrickEntry && conditionalNodes.length === 1) {
      rawContainer[rawKey] = conditionalNodes[0].raw;
    } else if (deleteEmptyArray && conditionalNodes.length === 0) {
      delete rawContainer[rawKey];
    } else {
      rawContainer[rawKey] = conditionalNodes.map((node) => node.raw);
    }
  }
}

/**
 * Like `removeDeadConditions` but applied to a custom template.
 */
export function removeDeadConditionsInTpl(
  tplConstructor: CustomTemplateConstructor,
  options?: RemoveDeadConditionsOptions
): void {
  const ast = parseTemplate(tplConstructor);
  removeDeadConditionsByAst(ast, options);
}

export interface IfContainer {
  if?: unknown;
}

export function computeConstantCondition(
  ifContainer: IfContainer,
  options: RemoveDeadConditionsOptions = {}
): void {
  if (hasOwnProperty(ifContainer, "if") && ifContainer.if !== undefined) {
    if (typeof ifContainer.if === "string" && isEvaluable(ifContainer.if)) {
      try {
        const { expression, attemptToVisitGlobals, source } = preevaluate(
          ifContainer.if
        );
        const { constantFeatureFlags, featureFlags } = options;
        let hasDynamicVariables = false;
        for (const item of attemptToVisitGlobals) {
          if (
            item !== "undefined" &&
            (!constantFeatureFlags || item !== "FLAGS")
          ) {
            hasDynamicVariables = true;
            break;
          }
        }
        if (hasDynamicVariables) {
          if (isConstantLogical(expression, false, options)) {
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.warn("[removed dead if]:", ifContainer.if, ifContainer);
            }
            ifContainer.if = false;
          } else if (isConstantLogical(expression, true, options)) {
            ifContainer.if = true;
          }
          return;
        }
        const originalIf = ifContainer.if;
        const globalVariables: Record<string, unknown> = {
          undefined: undefined,
        };
        if (constantFeatureFlags) {
          globalVariables.FLAGS = featureFlags;
        }
        ifContainer.if = !!cook(expression, source, { globalVariables });
        if (
          process.env.NODE_ENV === "development" &&
          ifContainer.if === false
        ) {
          // eslint-disable-next-line no-console
          console.warn("[removed dead if]:", originalIf, ifContainer);
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
