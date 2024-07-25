import { preevaluate } from "@next-core/cook";
import {
  MemberUsage,
  beforeVisitGlobalMember,
} from "./beforeVisitGlobalMember.js";

interface trackAllResult {
  context: string[] | false;
  state: string[] | false;
  formState: string[] | false;
}

const TRACK_NAMES = ["CTX", "STATE", "FORM_STATE"];

export function track(
  raw: string,
  trackText: string,
  variableName: string
): Set<string> | false {
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

export function trackAll(raw: string): trackAllResult | false {
  // Do not pre-evaluate a string if it doesn't include track names.
  if (TRACK_NAMES.some((name) => raw.includes(name))) {
    const usage: MemberUsage = {
      usedProperties: new Set(),
      hasNonStaticUsage: false,
    };
    preevaluate(raw, {
      withParent: true,
      hooks: {
        beforeVisitGlobal: beforeVisitGlobalMember(usage, TRACK_NAMES, 1, true),
      },
    });
    if (usage.usedProperties.size > 0) {
      const usedProperties = [...usage.usedProperties];
      const result: trackAllResult = {
        context: false,
        state: false,
        formState: false,
      };
      const keyMap: Record<string, keyof trackAllResult> = {
        CTX: "context",
        STATE: "state",
        FORM_STATE: "formState",
      };
      usedProperties.forEach((item) => {
        const [key, name] = item.split(".");
        if (!result[keyMap[key]]) {
          result[keyMap[key]] = [];
        }
        (result[keyMap[key]] as string[]).push(name);
      });
      return result;
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `You are using track all but no "CTX" or "STATE" or "FORM_STATE" usage found in your expression: ${JSON.stringify(
          raw
        )}`
      );
    }
  }
  return false;
}
