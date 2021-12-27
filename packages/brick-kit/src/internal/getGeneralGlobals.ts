import { getFixedT } from "i18next";
import { identity } from "lodash";
import type { MicroApp } from "@next-core/brick-types";
import { widgetI18nFactory } from "../core/WidgetI18n";
import { i18nText } from "../i18nText";
import { getI18nNamespace } from "../i18n";
import { ImagesFactory, imagesFactory, widgetImagesFactory } from "./images";
import { getBasePath } from "./getBasePath";
import { checkPermissions } from "./checkPermissions";

export interface GeneralGlobalsOptions {
  collectCoverage?: unknown;
  widgetId?: string;
  app?: PartialMicroApp;
  storyboardFunctions?: unknown;
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
  { collectCoverage, widgetId, app, storyboardFunctions }: GeneralGlobalsOptions
): unknown {
  switch (variableName) {
    case "BASE_URL":
      return collectCoverage ? "/next" : getBasePath().replace(/\/$/, "");
    case "FN":
      return storyboardFunctions;
    case "IMG":
      return collectCoverage
        ? fakeImageFactory()
        : widgetId
        ? widgetImagesFactory(widgetId)
        : imagesFactory(app.id, app.isBuildPush);
    case "I18N":
      return collectCoverage
        ? identity
        : widgetId
        ? widgetI18nFactory(widgetId)
        : getFixedT(null, getI18nNamespace("app", app.id));
    case "I18N_TEXT":
      return collectCoverage ? fakeI18nText : i18nText;
    case "PERMISSIONS":
      return {
        check: collectCoverage ? fakeCheckPermissions : checkPermissions,
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
