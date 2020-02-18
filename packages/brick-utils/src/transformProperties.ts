import { GeneralTransform } from "@easyops/brick-types";
import { get, set } from "lodash";
import { isObject } from "./isObject";
import { processPipes } from "./pipes";

export function transformProperties(
  props: Record<string, any>,
  data: any,
  transform: GeneralTransform,
  transformFrom?: string | string[]
): Record<string, any> {
  const transformedProps = preprocessTransformProperties(
    transformFrom ? get(data, transformFrom) : data,
    transform
  );
  for (const [propName, propValue] of Object.entries(transformedProps)) {
    set(props, propName, propValue);
  }
  return props;
}

export function doTransform(data: any, transformTo: any, smart?: boolean): any {
  if (typeof transformTo === "string") {
    const matches = transformTo.match(
      /^@\{([^|=}]*)(?:=([^|}]*))?((?:\|(?:[^|]+))*)\}$/
    );
    if (matches) {
      // If it's a full match, keep the original type.
      // If meet `@{}`, return `data`.
      // return matches[1] ? get(data, matches[1]) : data;
      return replaceTemplateValue(matches, data);
    }
    return transformTo.replace(
      /@\{([^|=}]*)(?:=([^|}]*))?((?:\|(?:[^|]+))*)\}/g,
      (raw, field, defaultValue, rawPipes) =>
        // If the retrieved data is null/undefined, replace it with an empty string.
        // (field ? get(data, field) : data) ?? ""
        replaceTemplateValue([raw, field, defaultValue, rawPipes], data, true)
    );
  }

  return Array.isArray(transformTo)
    ? transformTo.map(item => doTransform(data, item, smart))
    : isObject(transformTo)
    ? Object.entries(transformTo).reduce<Record<string, any>>((acc, [k, v]) => {
        if (smart) {
          set(acc, k, doTransform(data, v, smart));
        } else {
          acc[k] = doTransform(data, v, smart);
        }
        return acc;
      }, {})
    : transformTo;
}

function replaceTemplateValue(
  matches: string[],
  data: any,
  asString?: boolean
): any {
  const [_raw, field, defaultValue, rawPipes] = matches;
  let result = field ? get(data, field) : data;
  if (result === undefined) {
    result = defaultValue;
  }
  if (asString && !rawPipes && (result === undefined || result === null)) {
    return "";
  }
  return processPipes(result, rawPipes);
}

function preprocessTransformProperties(
  data: any,
  transform: GeneralTransform
): Record<string, any> {
  // Return empty object if transform is falsy.
  if (!transform) {
    return {};
  }

  // A single string `transform` means directly return data to this property.
  if (typeof transform === "string") {
    return { [transform]: data };
  }

  const props: Record<string, any> = {};
  const isArray = Array.isArray(data);
  for (const [transformedPropName, transformTo] of Object.entries(transform)) {
    // If data is array, mapping it's items.
    props[transformedPropName] = isArray
      ? (data as any[]).map(item => doTransform(item, transformTo, true))
      : doTransform(data, transformTo, true);
  }

  return props;
}

export function transformIntermediateData(
  data: any,
  transform: GeneralTransform,
  transformFrom?: string | string[]
): any {
  const intermediateData = transformFrom ? get(data, transformFrom) : data;
  if (!transform) {
    return intermediateData;
  }
  return transformProperties({}, intermediateData, transform);
}
