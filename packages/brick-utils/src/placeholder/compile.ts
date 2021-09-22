import { get } from "lodash";
import {
  PluginRuntimeContext,
  StoryboardContextItem,
} from "@next-core/brick-types";
import { processPipes } from "@next-core/pipes";
import { parseInjectableString } from "./syntax";
import { Placeholder } from "./interfaces";
import { getRegExpOfPlaceholder } from "./lexical";

export function transform(raw: string, data: any): any {
  return compile(raw, "@", data);
}

export function inject(raw: string, context: PluginRuntimeContext): any {
  return compile(raw, "$", undefined, context);
}

export function transformAndInject(
  raw: string,
  data: any,
  context: PluginRuntimeContext
): any {
  return compile(raw, ["@", "$"], data, context);
}

type CompileNode = (node: Placeholder) => any;

function compile(
  raw: string,
  symbols: string | string[],
  data?: any,
  context?: PluginRuntimeContext
): any {
  // const symbols = ["@", "$"];
  if (!isInjectable(raw, symbols)) {
    return raw;
  }

  const transformNode = transformNodeFactory(data);
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

function reduceCompiledValues(values: any[]): any {
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

function transformNodeFactory(data: any): CompileNode {
  return function transformNode(node: Placeholder): any {
    // If meet `@{}`, return `data`.
    let result = node.field ? get(data, node.field) : data;

    if (result === undefined) {
      result = node.defaultValue;
    }

    return processPipes(result, node.pipes);
  };
}

function injectNodeFactory(
  context: PluginRuntimeContext,
  raw: string
): CompileNode {
  return function injectNode(node: Placeholder): any {
    const matches = node.field.match(
      /^(?:(QUERY(?:_ARRAY)?|EVENT|query|event|APP|HASH|ANCHOR|SYS|FLAGS|CTX)\.)?(.+)$/
    );
    if (!matches) {
      // Keep the original raw partial when meet a unknown namespace.
      return raw.substring(node.loc.start, node.loc.end);
    }
    let [_full, namespace, subField] = matches;

    // Support namespace with no subfield such as `${ANCHOR}`.
    // But distinguish with match params. E.g. `${query}` is a match param.
    if (!namespace && /^[A-Z_]+$/.test(subField)) {
      namespace = subField;
      subField = "*";
    }

    let result;
    let anchor: string;
    const SimpleContextMap: Record<string, "hash" | "sys" | "flags"> = {
      HASH: "hash",
      SYS: "sys",
      FLAGS: "flags",
    };
    let contextItem: StoryboardContextItem;

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
      case "SYS":
      case "FLAGS":
        result =
          subField === "*"
            ? context[SimpleContextMap[namespace]]
            : get(context[SimpleContextMap[namespace]], subField);
        break;
      case "ANCHOR":
        anchor = context.hash ? context.hash.substr(1) : null;
        result = subField === "*" ? anchor : get(anchor, subField);
        break;
      case "CTX":
        contextItem = context.storyboardContext?.get(subField);
        if (contextItem) {
          result =
            contextItem.type === "brick-property"
              ? contextItem.brick.element?.[
                  contextItem.prop as keyof HTMLElement
                ]
              : contextItem.value;
        }
        break;
      default:
        if (context.match) {
          result = context.match.params[subField];
        } else {
          // If the context is empty, return the original raw partial.
          return raw.substring(node.loc.start, node.loc.end);
        }
    }

    if (result === undefined) {
      result = node.defaultValue;
    }

    return processPipes(result, node.pipes);
  };
}
