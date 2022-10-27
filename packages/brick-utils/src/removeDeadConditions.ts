import type {
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
import { remove } from "lodash";
import { hasOwnProperty } from "./hasOwnProperty";
import {
  parseStoryboard,
  parseTemplate,
  traverse,
  type StoryboardNode,
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
    let rawContainer: any;
    let conditionalNodes: ConditionalStoryboardNode[];
    let rawKey: string;
    let deleteEmptyArray = false;

    switch (node.type) {
      case "Root":
        conditionalNodes = node.routes;
        rawContainer = node.raw;
        rawKey = "routes";
        break;
      case "Template":
        conditionalNodes = node.bricks as ConditionalStoryboardNode[];
        rawContainer = node.raw;
        rawKey = "bricks";
        break;
      case "Route":
      case "Slot":
        conditionalNodes = node.children as ConditionalStoryboardNode[];
        rawContainer = node.raw;
        rawKey = node.raw.type === "routes" ? "routes" : "bricks";
        break;
      case "Event":
      case "EventCallback":
      case "SimpleLifeCycle":
      case "ConditionalEvent":
        conditionalNodes = node.handlers;
        rawContainer = node.rawContainer;
        rawKey = node.rawKey;
        deleteEmptyArray = true;
        break;
      case "ResolveLifeCycle":
        conditionalNodes = node.resolves;
        rawContainer = node.rawContainer;
        rawKey = node.rawKey;
        deleteEmptyArray = true;
        break;
      case "UseBrickEntry":
        conditionalNodes = node.children as ConditionalStoryboardNode[];
        rawContainer = node.rawContainer;
        rawKey = node.rawKey;
        break;
    }

    shakeConditionalNodes(
      node,
      rawContainer,
      conditionalNodes,
      rawKey,
      deleteEmptyArray
    );

    // Remove unreachable context/state.
    deleteEmptyArray = false;
    switch (node.type) {
      case "Route":
      case "Brick":
      case "Template":
        rawContainer = node.raw;
        rawKey = node.type === "Template" ? "state" : "context";
        conditionalNodes = node.context;
        break;
    }

    shakeConditionalNodes(
      node,
      rawContainer,
      conditionalNodes,
      rawKey,
      deleteEmptyArray
    );
  });
}

function shakeConditionalNodes(
  node: StoryboardNode,
  rawContainer: any,
  conditionalNodes: ConditionalStoryboardNode[],
  rawKey: string,
  deleteEmptyArray?: boolean
): void {
  const removedNodes = remove(
    conditionalNodes,
    (node) => node.raw.if === false
  );
  if (removedNodes.length > 0) {
    if (node.type === "UseBrickEntry" && !Array.isArray(rawContainer[rawKey])) {
      rawContainer[rawKey] = { brick: "div", if: false };
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
  if (hasOwnProperty(ifContainer, "if")) {
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
