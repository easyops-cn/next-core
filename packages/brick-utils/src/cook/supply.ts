import lodash from "lodash";
import moment from "moment";
import { CookScope } from "./interfaces";
import { PipeRegistry } from "../placeholder/pipes";

export function supply(
  attemptToVisitGlobals: Set<string>,
  globalVariables: Record<string, unknown> = {}
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

const shouldOmitInLodash = new Set([
  // Omit all mutable methods from lodash.
  // But allow sequence methods like `_.chain`.
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
  /**
   * Ignore `Function` methods from lodash, too.
   * There are chances to invoke `Object.assign`, etc.
   *
   * E.g.:
   *
   * ```
   * _.wrap(_.method('constructor.assign',{b:2},{b:3}),(func,...a) => func(...a))({})
   * ```
   */
  "after",
  "ary",
  "before",
  "bind",
  "bindKey",
  "curry",
  "curryRight",
  "debounce",
  "defer",
  "delay",
  "flip",
  "memoize",
  "negate",
  "once",
  "overArgs",
  "partial",
  "partialRight",
  "rearg",
  "rest",
  "spread",
  "throttle",
  "unary",
  "wrap",
]);

// Omit all mutable methods from moment.
const shouldOmitInMoment = new Set([
  "lang",
  "langData",
  "locale",
  "localeData",
  "defineLocale",
  "updateLocale",
  "updateOffset",
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

function supplyIndividual(variableName: string): unknown {
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
    case "moment":
      return Object.assign(
        (...args: Parameters<typeof moment>) => moment(...args),
        Object.fromEntries(
          Object.entries(moment).filter(
            (entry) => !shouldOmitInMoment.has(entry[0])
          )
        )
      );
    case "PIPES":
      return Object.fromEntries(PipeRegistry.entries());
    case "location":
      return { href: location.href, origin: location.origin };
    default:
      if (allowedGlobalObjects.has(variableName)) {
        return window[variableName as keyof Window];
      }
  }
}

function delegateMethods(
  target: unknown,
  methods: string[]
): Record<string, (...args: unknown[]) => unknown> {
  return Object.fromEntries(
    methods.map((method) => [
      method,
      <T>(...args: T[]) =>
        (target as Record<typeof method, (...args: T[]) => unknown>)[
          method
        ].apply(target, args),
    ])
  );
}
