import { preevaluate } from "@next-core/cook";
import {
  MemberUsage,
  beforeVisitGlobalMember,
} from "./beforeVisitGlobalMember.js";

export function track(
  raw: string,
  trackText: string,
  variableName: string
): Iterable<string> | false {
  if (raw.includes(trackText)) {
    const usage: MemberUsage = {
      usedProperties: new Set(),
      hasNonStaticUsage: false,
    };
    const { expression } = preevaluate(raw, {
      withParent: true,
      hooks: {
        beforeVisitGlobal: beforeVisitGlobalMember(usage, variableName),
      },
    });
    let trackCtxExp: any;
    if (
      expression.type === "SequenceExpression" &&
      (trackCtxExp = expression.expressions[0] as unknown) &&
      trackCtxExp.type === "Literal" &&
      trackCtxExp.value === trackText
    ) {
      if (usage.usedProperties.size > 0) {
        return usage.usedProperties;
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
