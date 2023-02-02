import { get } from "lodash";
import type { RuntimeContext } from "@next-core/brick-types";
import { processPipes } from "@next-core/pipes";
import { parseInjectableString } from "./syntax.js";
import type { Placeholder } from "./interfaces.js";
import { getRegExpOfPlaceholder } from "./lexical.js";

export function transform(raw: string, context: RuntimeContext): unknown {
  return compile(raw, "@", context);
}

export function inject(raw: string, context: RuntimeContext): unknown {
  return compile(raw, "$", context);
}

export function transformAndInject(
  raw: string,
  context: RuntimeContext
): unknown {
  return compile(raw, ["@", "$"], context);
}

type CompileNode = (node: Placeholder) => unknown;

function compile(
  raw: string,
  symbols: string | string[],
  context: RuntimeContext
): unknown {
  // const symbols = ["@", "$"];
  if (!isInjectable(raw, symbols)) {
    return raw;
  }

  const transformNode = transformNodeFactory(context.data);
  const injectNode = injectNodeFactory(context, raw);

  const tree = parseInjectableString(raw, symbols);
  const values = tree.elements.map((node) =>
    node.type === "RawString"
      ? node.value
      : node.symbol === "$"
      ? injectNode(node)
      : transformNode(node)
  );

  return reduceCompiledValues(values);
}

function reduceCompiledValues(values: unknown[]): unknown {
  // If the whole string is a placeholder, we should keep the original value.
  if (values.length === 1) {
    return values[0];
  }

  // If an element is `undefined`, `null` or an empty array `[]`, it is converted to an empty string.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join#Description
  return values.join("");
}

function isInjectable(raw: string, symbols?: string | string[]): boolean {
  return getRegExpOfPlaceholder(symbols).test(raw);
}

function transformNodeFactory(data: unknown): CompileNode {
  return function transformNode(node: Placeholder): unknown {
    // If meet `@{}`, return `data`.
    let result = node.field ? get(data, node.field) : data;

    if (result === undefined) {
      result = node.defaultValue;
    }

    return processPipes(result, node.pipes);
  };
}

function injectNodeFactory(context: RuntimeContext, raw: string): CompileNode {
  return function injectNode(node: Placeholder): unknown {
    const matches = node.field.match(
      /^(?:(QUERY(?:_ARRAY)?|EVENT|query|event|APP|HASH|ANCHOR|SYS|FLAGS)\.)?(.+)$/
    );
    if (!matches) {
      // Keep the original raw partial when meet a unknown namespace.
      return raw.substring(node.loc.start, node.loc.end);
    }
    let [, namespace, subField] = matches;

    // Support namespace with no subfield such as `${ANCHOR}`.
    // But distinguish with match params. E.g. `${query}` is a match param.
    if (!namespace && /^[A-Z_]+$/.test(subField)) {
      namespace = subField;
      subField = "*";
    }

    let result: unknown;
    // const SimpleContextMap: Record<string, "hash" | "sys" | "flags"> = {
    //   HASH: "hash",
    //   SYS: "sys",
    //   FLAGS: "flags",
    // };

    switch (namespace) {
      case "QUERY":
      case "query":
        if (subField === "*") {
          result = context.query;
        } else {
          result = context.query.has(subField)
            ? context.query.get(subField)
            : undefined;
        }
        break;
      case "QUERY_ARRAY":
        result = context.query.has(subField)
          ? context.query.getAll(subField)
          : undefined;
        break;
      case "EVENT":
      case "event":
        if (context.event === undefined) {
          // Keep the original raw partial when meet a `${EVENT}` in non-event context.
          return raw.substring(node.loc.start, node.loc.end);
        }
        result =
          subField === "*" ? context.event : get(context.event, subField);
        break;
      case "APP":
        result =
          subField === "*"
            ? context.overrideApp ?? context.app
            : get(context.overrideApp ?? context.app, subField);
        break;
      case "HASH":
        result = context.location.hash;
        break;
      // case "SYS":
      // case "FLAGS":
      //   result =
      //     subField === "*"
      //       ? context[SimpleContextMap[namespace]]
      //       : get(context[SimpleContextMap[namespace]], subField);
      //   break;
      case "ANCHOR": {
        const anchor = context.location.hash
          ? context.location.hash.substr(1)
          : null;
        result = subField === "*" ? anchor : get(anchor, subField);
        break;
      }
      case "CTX":
        throw new Error("CTX is not supported in placeholder any more");
      default:
        // if (context.match) {
        //   result = context.match.params[subField];
        // } else {
        // If the context is empty, return the original raw partial.
        return raw.substring(node.loc.start, node.loc.end);
      // }
    }

    if (result === undefined) {
      result = node.defaultValue;
    }

    return processPipes(result, node.pipes);
  };
}
