import type {
  CustomTemplateConstructor,
  MetaI18n,
  StoryboardFunction,
} from "@next-core/types";
import type { NextHistory } from "./history.js";
import type { IfContainer } from "./internal/compute/checkIf.js";

interface DLL {
  (moduleId: "tYg3"): Kit;
}

interface Kit {
  getRuntime(): {
    registerCustomTemplate(
      tagName: string,
      constructor: CustomTemplateConstructor
    ): void;
    registerCustomProcessor(
      processorFullName: string,
      processorFunc: Function
    ): void;
    registerWidgetFunctions(
      widgetId: string,
      functions: StoryboardFunction[],
      widgetVersion?: string
    ): void;
    registerWidgetI18n(widgetId: string, i18nData: MetaI18n): void;
  };
  getHistory(): NextHistory;
  looseCheckIfByTransform(ifContainer: IfContainer, data: unknown): boolean;
  doTransform(data: unknown, to: unknown, options?: unknown): unknown;
  transformProperties(
    props: Record<string, unknown>,
    data: unknown,
    to: LegacyGeneralTransform,
    from?: string | string[],
    mapArray?: boolean | "auto",
    options?: unknown
  ): Record<string, unknown>;
  SingleBrickAsComponentFactory: any;
  BrickAsComponentFactory: any;
  authenticate: any;
  getAuth: any;
  isLoggedIn: any;
  logout: any;
}

export type LegacyGeneralTransform =
  | string
  | LegacyTransformMap
  | LegacyTransformItem[]
  | null
  | undefined;

export interface LegacyTransformMap {
  [propName: string]: unknown;
}

export interface LegacyTransformItem {
  from?: string | string[];
  to: string | LegacyTransformMap;
  mapArray?: boolean | "auto";
}

export function getV2RuntimeFromDll() {
  const { dll } = window as { dll?: DLL };
  if (
    dll &&
    window.BRICK_NEXT_VERSIONS?.["brick-container"]?.startsWith("2.")
  ) {
    return dll("tYg3");
  }
}
