// import { getFixedT } from "i18next";
// import { identity } from "lodash";
import type { MicroApp } from "@next-core/types";
// import { widgetI18nFactory } from "../core/WidgetI18n";
// import { i18nText } from "../i18nText";
// import { getI18nNamespace } from "../i18n";
// import { ImagesFactory, imagesFactory, widgetImagesFactory } from "./images";
import { checkPermissions } from "../checkPermissions.js";
import { getReadOnlyProxy } from "../proxyFactories.js";
import { getTheme } from "../../themeAndMode.js";
import { getBasePath } from "../../getBasePath.js";

export interface GeneralGlobalsOptions {
  collectCoverage?: unknown;
  widgetId?: string;
  widgetVersion?: string;
  app?: PartialMicroApp;
  appendI18nNamespace?: string;
  storyboardFunctions?: unknown;
  isStoryboardFunction?: boolean;
}

export type PartialMicroApp = Pick<MicroApp, "id" | "isBuildPush">;

// `GeneralGlobals` are globals which are page-state-agnostic,
// thus they can be used both in storyboard expressions and functions.
export function getGeneralGlobals(
  attemptToVisitGlobals: Set<string>,
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
      return storyboardFunctions;
    // case "IMG":
    //   return collectCoverage
    //     ? fakeImageFactory()
    //     : widgetId
    //     ? widgetImagesFactory(widgetId, widgetVersion)
    //     : imagesFactory(app.id, app.isBuildPush);
    // case "I18N":
    //   return collectCoverage
    //     ? identity
    //     : widgetId
    //     ? widgetI18nFactory(widgetId)
    //     : getFixedT(
    //         null,
    //         [appendI18nNamespace, getI18nNamespace("app", app.id)].filter(
    //           Boolean
    //         )
    //       );
    // case "I18N_TEXT":
    //   return collectCoverage ? fakeI18nText : i18nText;
    case "PERMISSIONS":
      return getReadOnlyProxy({
        check: collectCoverage ? fakeCheckPermissions : checkPermissions,
      });
    case "THEME":
      return getReadOnlyProxy({
        getTheme: collectCoverage ? () => "light" : getTheme,
        // getCssPropertyValue: collectCoverage ? () => "" : getCssPropertyValue,
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

// function fakeI18nText(data: Record<string, string>): string {
//   return data?.en;
// }

// function fakeImageFactory(): ImagesFactory {
//   return {
//     get(name: string) {
//       return `mock/images/${name}`;
//     },
//   };
// }

function fakeCheckPermissions(): boolean {
  return true;
}
