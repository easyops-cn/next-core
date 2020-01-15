import { get } from "lodash";
import { PluginRuntimeContext } from "@easyops/brick-types";
import { isObject } from "./isObject";

const replaceTemplateValue = (
  matches: string[],
  context: PluginRuntimeContext,
  asString?: boolean
): any => {
  const [raw, namespace, field, defaultValue, type] = matches;
  let result;

  if (namespace === "QUERY" || namespace === "query") {
    if (field === "*") {
      result = context.query;
    } else {
      result = context.query.has(field)
        ? context.query.get(field)
        : defaultValue;
    }
  } else if (namespace === "EVENT" || namespace === "event") {
    if (context.event === undefined) {
      return raw;
    }
    result = field === "*" ? context.event : get(context.event, field);
  } else if (namespace === "APP") {
    result = get(context.app, field);
  } else if (namespace === "HASH") {
    result = context.hash;
  } else if (context.match) {
    result = context.match.params[field];
    if (result === undefined) {
      result = defaultValue;
    }
  }
  if (result === undefined || result === null) {
    return asString ? "" : undefined;
  }
  switch (type) {
    case undefined:
      return result;
    case "string":
      return String(result);
    case "number":
      return Number(result);
    case "bool":
    case "boolean":
      return Boolean(Number(result));
    case "json":
      try {
        return JSON.parse(result);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return;
      }
    case "jsonStringify":
      try {
        return JSON.stringify(result, null, 2);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return;
      }
  }
};

export const computeRealValue = (
  value: any,
  context: PluginRuntimeContext,
  injectDeep?: boolean
): any => {
  if (typeof value !== "string") {
    let newValue = value;
    if (injectDeep && isObject(value)) {
      if (Array.isArray(value)) {
        newValue = value.map(v => computeRealValue(v, context, injectDeep));
      } else {
        newValue = Object.entries(value).reduce<Record<string, any>>(
          (acc, [k, v]) => {
            k = computeRealValue(k, context, false);
            acc[k] = computeRealValue(v, context, injectDeep);
            return acc;
          },
          {}
        );
      }
    }

    return newValue;
  }
  const matches = value.match(
    /^\$\{(?:(QUERY|EVENT|query|event|APP|HASH)\.)?([^|=}]+)(?:=([^|]*))?(?:\|(string|number|bool(?:ean)?|json|jsonStringify))?\}$/
  );
  if (matches) {
    return replaceTemplateValue(matches, context);
  }

  return value.replace(
    /\$\{(?:(QUERY|EVENT|query|event|APP|HASH)\.)?([^|=}]+)(?:=([^|]*))?(?:\|(string|number|bool(?:ean)?|json|jsonStringify))?\}/g,
    (raw, query, field, defaultValue, type) =>
      replaceTemplateValue(
        [raw, query, field, defaultValue, type],
        context,
        true
      )
  );
};

export function setProperties(
  bricks: HTMLElement | HTMLElement[],
  properties: Record<string, any>,
  context: PluginRuntimeContext,
  injectDeep?: boolean
): void {
  const realProps = computeRealProperties(properties, context, injectDeep);
  if (!Array.isArray(bricks)) {
    bricks = [bricks];
  }
  bricks.forEach(brick => {
    setRealProperties(brick, realProps);
  });
}

export function setRealProperties(
  brick: HTMLElement,
  realProps: Record<string, any>
): void {
  for (const [propName, propValue] of Object.entries(realProps)) {
    if (propName === "style") {
      for (const [styleName, styleValue] of Object.entries(propValue)) {
        (brick.style as any)[styleName] = styleValue;
      }
    } else {
      (brick as any)[propName] = propValue;
    }
  }
}

export function computeRealProperties(
  properties: Record<string, any>,
  context: PluginRuntimeContext,
  injectDeep?: boolean
): any {
  const result: Record<string, any> = {};

  if (isObject(properties)) {
    for (const [propName, propValue] of Object.entries(properties)) {
      if (propName === "style") {
        if (isObject(propValue)) {
          result.style = propValue;
        }
      } else {
        // Related: https://github.com/facebook/react/issues/11347
        const realValue = computeRealValue(propValue, context, injectDeep);
        if (realValue !== undefined) {
          result[propName] = realValue;
        }
      }
    }
  }

  return result;
}
