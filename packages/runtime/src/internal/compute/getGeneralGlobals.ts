import { identity } from "lodash";
import type { MicroApp } from "@next-core/types";
import { i18n, i18nText } from "@next-core/i18n";
import { widgetI18nFactory } from "./WidgetI18n.js";
import { getReadOnlyProxy } from "../proxyFactories.js";
import { getCssPropertyValue, getTheme } from "../../themeAndMode.js";
import { getBasePath } from "../../getBasePath.js";
import { getI18nNamespace } from "../registerAppI18n.js";
import { ImagesFactory, hooks } from "../Runtime.js";
import { isolatedFunctionRegistry } from "./IsolatedFunctions.js";

export interface GeneralGlobalsOptions {
  collectCoverage?: unknown;
  widgetId?: string;
  widgetVersion?: string;
  isolatedRoot?: symbol;
  app?: PartialMicroApp;
  appendI18nNamespace?: string;
  storyboardFunctions?: unknown;
  isStoryboardFunction?: boolean;
}

export type PartialMicroApp = Pick<MicroApp, "id" | "isBuildPush">;

// `GeneralGlobals` are globals which are page-state-agnostic,
// thus they can be used both in storyboard expressions and functions.
export function getGeneralGlobals(
  attemptToVisitGlobals: Set<string> | string[],
  options: GeneralGlobalsOptions
): Record<string, unknown> {
  const globalVariables: Record<string, unknown> = {};
  for (const variableName of attemptToVisitGlobals) {
    const variable = getIndividualGlobal(variableName, options);
    if (variable !== undefined) {
      globalVariables[variableName] = variable;
    }
  }
  return globalVariables;
}

function getIndividualGlobal(
  variableName: string,
  {
    collectCoverage,
    widgetId,
    widgetVersion,
    isolatedRoot,
    app,
    appendI18nNamespace,
    storyboardFunctions,
    isStoryboardFunction,
  }: GeneralGlobalsOptions
): unknown {
  switch (variableName) {
    case "BASE_URL":
      return collectCoverage ? "/next" : getBasePath().replace(/\/$/, "");
    case "FN":
      return isolatedRoot
        ? isolatedFunctionRegistry.get(isolatedRoot)
        : storyboardFunctions;
    case "IMG":
      return collectCoverage
        ? fakeImageFactory()
        : widgetId
          ? hooks?.images?.widgetImagesFactory(widgetId, widgetVersion)
          : hooks?.images?.imagesFactory(
              app!.id,
              app!.isBuildPush,
              (app as { currentVersion?: string }).currentVersion
            );
    case "I18N":
      return collectCoverage
        ? identity
        : widgetId
          ? widgetI18nFactory(widgetId)
          : i18n.getFixedT(
              null,
              [appendI18nNamespace, getI18nNamespace("app", app!.id)].filter(
                Boolean
              ) as string[]
            );
    case "I18N_TEXT":
      return collectCoverage ? fakeI18nText : i18nText;
    case "LANGUAGE": {
      return collectCoverage ? "zh" : i18n.language || "zh";
    }
    case "PERMISSIONS":
      return getReadOnlyProxy({
        check: collectCoverage
          ? fakeCheckPermissions
          : hooks?.checkPermissions?.checkPermissions,
      });
    case "THEME":
      return getReadOnlyProxy({
        getTheme: collectCoverage ? () => "light" : getTheme,
        getCssPropertyValue: collectCoverage ? () => "" : getCssPropertyValue,
      });
    case "console":
      return isStoryboardFunction ? getReadOnlyProxy(console) : undefined;
    case "location":
      return collectCoverage
        ? {
            href: "http://localhost:3000/functions/test",
            origin: "http://localhost:3000",
            host: "localhost:3000",
            hostname: "localhost",
          }
        : {
            href: location.href,
            origin: location.origin,
            host: location.host,
            hostname: location.hostname,
          };
  }
}

function fakeI18nText(data: Record<string, string>): string {
  return data?.en;
}

function fakeImageFactory(): ImagesFactory {
  return {
    get(name: string) {
      return `mock/images/${name}`;
    },
  };
}

function fakeCheckPermissions(): boolean {
  return true;
}
