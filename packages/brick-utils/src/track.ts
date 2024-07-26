import { PrecookHooks, preevaluate } from "./cook";
import { visitStoryboardExpressions } from "./visitStoryboard";

const TRACK_NAMES = ["CTX", "STATE", "FORM_STATE"];

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

export function trackFormState(raw: string): string[] | false {
  return track(raw, "track formstate", "FORM_STATE");
}

export function trackUsedContext(data: unknown): string[] {
  return collectContextUsage(data, "CTX").usedContexts;
}

export function trackUsedState(data: unknown): string[] {
  return collectContextUsage(data, "STATE").usedContexts;
}

export function trackUsedFormState(data: unknown): string[] {
  return collectContextUsage(data, "FORM_STATE").usedContexts;
}

interface trackAllResult {
  context: string[] | false;
  state: string[] | false;
  formState: string[] | false;
}

function track(
  raw: string,
  trackText: string,
  variableName: string
): string[] | false {
  if (raw.includes(trackText)) {
    // const contexts = new Set<string>();
    const usage: ContextUsage = {
      usedContexts: [],
      includesComputed: false,
    };
    const { expression } = preevaluate(raw, {
      cache: true,
      withParent: true,
      hooks: {
        beforeVisitGlobal: beforeVisitContextFactory(usage, variableName),
      },
    });
    // const contexts = usage
    let trackCtxExp: any;
    if (
      expression.type === "SequenceExpression" &&
      (trackCtxExp = expression.expressions[0] as unknown) &&
      trackCtxExp.type === "Literal" &&
      trackCtxExp.value === trackText
    ) {
      if (usage.usedContexts.length > 0) {
        return usage.usedContexts;
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
    const usage: ContextUsage = {
      usedContexts: [],
      includesComputed: false,
    };
    preevaluate(raw, {
      cache: true,
      withParent: true,
      hooks: {
        beforeVisitGlobal: beforeVisitContextFactory(usage, TRACK_NAMES, true),
      },
    });
    if (usage.usedContexts.length > 0) {
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
      usage.usedContexts.forEach((item) => {
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

export interface ContextUsage {
  usedContexts: string[];
  includesComputed: boolean;
}

function beforeVisitContextFactory(
  usage: ContextUsage,
  variableName: string | string[],
  rememberObjectName = false
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitContext(node, parent): void {
    if (
      typeof variableName === "string"
        ? node.name === variableName
        : variableName.includes(node.name)
    ) {
      const memberParent = parent[parent.length - 1];
      if (
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object"
      ) {
        const memberNode = memberParent.node;
        let used: string;
        if (!memberNode.computed && memberNode.property.type === "Identifier") {
          used = memberNode.property.name;
        } else if (
          memberNode.computed &&
          (memberNode.property as any).type === "Literal" &&
          typeof (memberNode.property as any).value === "string"
        ) {
          used = (memberNode.property as any).value;
        } else {
          usage.includesComputed = true;
        }
        if (used !== undefined && !usage.usedContexts.includes(used)) {
          usage.usedContexts.push(
            rememberObjectName ? `${node.name}.${used}` : used
          );
        }
      }
    }
  };
}

export function collectContextUsage(
  data: unknown,
  variableName: string
): ContextUsage {
  const usage: ContextUsage = {
    usedContexts: [],
    includesComputed: false,
  };
  visitStoryboardExpressions(
    data,
    beforeVisitContextFactory(usage, variableName),
    variableName
  );
  return usage;
}
