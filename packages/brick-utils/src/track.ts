import { PrecookHooks, preevaluate } from "./cook";
import { visitStoryboardExpressions } from "./visitStoryboard";

/**
 * Get tracking CTX for an evaluable expression in `track context` mode.
 *
 * A `track context` mode is an evaluable expression which is a sequence expression
 * starting with the exact literal string expression of "track context".
 *
 * @param raw - A raw string, which must be checked by `isEvaluable` first.
 *
 * @returns
 *
 * Returns used CTXs if `track context` mode is enabled, or returns false if not enabled or
 * no CTX found.
 *
 * @example
 *
 * ```js
 * trackContext('<% "track context", [CTX.hello, CTX.world] %>');
 * // => ["hello", "world"]
 *
 * trackContext('<% [CTX.hello, CTX.world] %>');
 * // => false
 *
 * trackContext('<% "track context", DATA.any %>');
 * // => false
 * ```
 */
export function trackContext(raw: string): string[] | false {
  return track(raw, "track context", "CTX");
}

export function trackState(raw: string): string[] | false {
  return track(raw, "track state", "STATE");
}

export function trackUsedContext(data: unknown): string[] {
  return trackUsed(data, "CTX");
}

export function trackUsedState(data: unknown): string[] {
  return trackUsed(data, "STATE");
}

function track(
  raw: string,
  trackText: string,
  variableName: string
): string[] | false {
  if (raw.includes(trackText)) {
    const contexts = new Set<string>();
    const { expression } = preevaluate(raw, {
      withParent: true,
      hooks: {
        beforeVisitGlobal: beforeVisitContextFactory(contexts, variableName),
      },
    });
    let trackCtxExp: any;
    if (
      expression.type === "SequenceExpression" &&
      (trackCtxExp = expression.expressions[0] as unknown) &&
      trackCtxExp.type === "Literal" &&
      trackCtxExp.value === trackText
    ) {
      if (contexts.size > 0) {
        return Array.from(contexts);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `You are using "${trackText}" but no \`${variableName}\` usage found in your expression: ${JSON.stringify(
            raw
          )}`
        );
      }
    }
  }
  return false;
}

function trackUsed(data: unknown, variableName: string): string[] {
  const contexts = new Set<string>();
  visitStoryboardExpressions(
    data,
    beforeVisitContextFactory(contexts, variableName),
    variableName
  );
  return Array.from(contexts);
}

function beforeVisitContextFactory(
  contexts: Set<string>,
  variableName: string
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitContext(node, parent): void {
    if (node.name === variableName) {
      const memberParent = parent[parent.length - 1];
      if (
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object"
      ) {
        const memberNode = memberParent.node;
        if (!memberNode.computed && memberNode.property.type === "Identifier") {
          contexts.add(memberNode.property.name);
        } else if (
          memberNode.computed &&
          (memberNode.property as any).type === "Literal" &&
          typeof (memberNode.property as any).value === "string"
        ) {
          contexts.add((memberNode.property as any).value);
        }
      }
    }
  };
}
