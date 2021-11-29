import { preevaluate } from "./cook";

const TRACK_CONTEXT = "track context";
const CTX = "CTX";

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
  if (raw.includes(TRACK_CONTEXT)) {
    const contexts = new Set<string>();
    const { expression } = preevaluate(raw, {
      withParent: true,
      hooks: {
        beforeVisitGlobal(node, parent): void {
          if (node.name === CTX) {
            const memberParent = parent[parent.length - 1];
            if (
              memberParent?.node.type === "MemberExpression" &&
              memberParent.key === "object"
            ) {
              const memberNode = memberParent.node;
              if (
                !memberNode.computed &&
                memberNode.property.type === "Identifier"
              ) {
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
        },
      },
    });
    let trackCtxExp: any;
    if (
      expression.type === "SequenceExpression" &&
      (trackCtxExp = expression.expressions[0] as unknown) &&
      trackCtxExp.type === "Literal" &&
      trackCtxExp.value === TRACK_CONTEXT
    ) {
      if (contexts.size > 0) {
        return Array.from(contexts);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `You are using "${TRACK_CONTEXT}" but no CTX usage found in your expression: "${raw}"`
        );
      }
    }
  }
  return false;
}
