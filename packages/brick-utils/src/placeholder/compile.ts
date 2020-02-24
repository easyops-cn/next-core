import { get } from "lodash";
import { PluginRuntimeContext } from "@easyops/brick-types";
import { parseInjectableString } from "./syntax";
import { processPipes } from "./pipes";
import { RawString, Placeholder } from "./interfaces";

export function transform(raw: string, data: any): any {
  return compile(raw, "@", transformNodeFactory(data));
}

export function inject(raw: string, context: PluginRuntimeContext): any {
  return compile(raw, "$", injectNodeFactory(context, raw));
}

type CompileNode = (node: RawString | Placeholder) => any;

function compile(raw: string, symbol: string, compileNode: CompileNode): any {
  if (!isInjectable(raw, symbol)) {
    return raw;
  }

  const tree = parseInjectableString(raw, symbol);

  const values = tree.elements.map(compileNode);

  // If the whole string is a placeholder, we should keep the original value.
  if (tree.elements.length === 1) {
    return values[0];
  }

  // If an element is `undefined`, `null` or an empty array `[]`, it is converted to an empty string.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join#Description
  return values.join("");
}

function isInjectable(raw: string, symbol = "$"): boolean {
  return raw.includes(`${symbol}{`);
}

function transformNodeFactory(data: any): CompileNode {
  return function transformNode(node: RawString | Placeholder): any {
    if (node.type === "RawString") {
      return node.value;
    }

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
  return function injectNode(node: RawString | Placeholder): any {
    if (node.type === "RawString") {
      return node.value;
    }
    const matches = node.field.match(
      /^(?:(QUERY(?:_ARRAY)?|EVENT|query|event|APP|HASH|SYS|FLAGS)\.)?(.+)$/
    );
    if (!matches) {
      // Keep the original raw partial when meet a unknown namespace.
      return raw.substring(node.loc.start, node.loc.end);
    }
    const [_full, namespace, subField] = matches;
    let result;
    if (namespace === "QUERY" || namespace === "query") {
      if (subField === "*") {
        result = context.query;
      } else {
        result = context.query.has(subField)
          ? context.query.get(subField)
          : undefined;
      }
    } else if (namespace === "QUERY_ARRAY") {
      result = context.query.has(subField)
        ? context.query.getAll(subField)
        : undefined;
    } else if (namespace === "EVENT" || namespace === "event") {
      if (context.event === undefined) {
        // Keep the original raw partial when meet a `${EVENT}` in non-event context.
        return raw.substring(node.loc.start, node.loc.end);
      }
      result = subField === "*" ? context.event : get(context.event, subField);
    } else if (namespace === "APP") {
      result = get(context.app, subField);
    } else if (namespace === "HASH") {
      result = context.hash;
    } else if (namespace === "SYS") {
      result = get(context.sys, subField);
    } else if (namespace === "FLAGS") {
      result = get(context.flags, subField);
    } else if (context.match) {
      result = context.match.params[subField];
    } else {
      // If the context is empty, return the original raw partial.
      return raw.substring(node.loc.start, node.loc.end);
    }

    if (result === undefined) {
      result = node.defaultValue;
    }

    return processPipes(result, node.pipes);
  };
}
