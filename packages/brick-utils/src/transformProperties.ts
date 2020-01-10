import { GeneralTransform } from "@easyops/brick-types";
import { get, set } from "lodash";
import { isObject } from "./isObject";

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

function transformSingleProperty(data: any, transformTo: any): any {
  if (typeof transformTo === "string") {
    const matches = transformTo.match(/^@\{([^}]*)\}$/);
    if (matches) {
      // If it's a full match, keep the original type.
      // If meet `@{}`, return `data`.
      return matches[1] ? get(data, matches[1]) : data;
    }
    return transformTo.replace(/@\{([^}]*)\}/g, (_raw, field) =>
      field ? get(data, field) : data
    );
  }

  return Array.isArray(transformTo)
    ? transformTo.map(item => transformSingleProperty(data, item))
    : isObject(transformTo)
    ? Object.entries(transformTo).reduce<Record<string, any>>(
        (acc, [k, v]) => set(acc, k, transformSingleProperty(data, v)),
        {}
      )
    : transformTo;
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
      ? (data as any[]).map(item => transformSingleProperty(item, transformTo))
      : transformSingleProperty(data, transformTo);
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
