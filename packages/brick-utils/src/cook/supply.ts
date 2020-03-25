import lodash from "lodash";
import { CookScope } from "./interfaces";
import { PipeRegistry } from "../placeholder/pipes/PipeRegistry";

export function supply(
  attemptToVisitGlobals: Set<string>,
  globalVariables: Record<string, any> = {}
): CookScope {
  const globalMap = new Map(Object.entries(globalVariables));

  // Allow limited DOM builtin values.
  globalMap.set("undefined", undefined);

  for (const variableName of attemptToVisitGlobals.values()) {
    if (!globalMap.has(variableName)) {
      const variable = supplyIndividual(variableName);
      if (variable !== undefined) {
        globalMap.set(variableName, variable);
      }
    }
  }

  return new Map(
    Array.from(globalMap.entries()).map((entry) => [
      entry[0],
      {
        cooked: entry[1],
        initialized: true,
      },
    ])
  );
}

// Omit all mutable methods from lodash.
const shouldOmitInLodash = new Set([
  // Allow sequence methods like `_.chain`.
  "fill",
  "pull",
  "pullAll",
  "pullAllBy",
  "pullAllWith",
  "pullAt",
  "remove",
  "reverse",
  "assign",
  "assignIn",
  "assignInWith",
  "assignWith",
  "defaults",
  "defaultsDeep",
  "merge",
  "mergeWith",
  "set",
  "setWith",
  "unset",
  "update",
  "updateWith",
]);

const allowedGlobalObjects = new Set([
  "Array",
  "Boolean",
  "Date",
  "Infinity",
  "JSON",
  "Math",
  "NaN",
  "Number",
  "String",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
]);

function supplyIndividual(variableName: string): any {
  switch (variableName) {
    case "Object":
      // Do not allow mutable methods like `Object.assign`.
      return delegateMethods(Object, [
        "entries",
        "fromEntries",
        "keys",
        "values",
      ]);
    case "_":
      return Object.fromEntries(
        Object.entries(lodash).filter(
          (entry) => !shouldOmitInLodash.has(entry[0])
        )
      );
    case "PIPES":
      return Object.fromEntries(PipeRegistry.entries());
    case "location":
      return { href: location.href };
    default:
      if (allowedGlobalObjects.has(variableName)) {
        return window[variableName as keyof Window];
      }
  }
}

function delegateMethods(
  target: any,
  methods: string[]
): Record<string, Function> {
  return Object.fromEntries(
    methods.map((method) => [
      method,
      (...args: any[]) => (target[method] as Function).apply(target, args),
    ])
  );
}
