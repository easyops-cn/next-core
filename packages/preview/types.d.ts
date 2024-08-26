import type { BrickPackage, MicroApp } from "@next-core/types";

export type RenderType = "html" | "yaml";

export interface Sources {
  yaml?: string;
  html?: string;
}

export interface RenderOptions {
  theme?: string;
  uiVersion?: string;
  language?: string;
  context?: string | unknown[];
  templates?: string | unknown[];
  functions?: string | unknown[];
  i18n?: string | object;
  url?: string;
  app?: MicroApp;
  styleText?: string;
  templatesAreArrayOfYaml?: boolean;
}

export interface PreviewWindow extends Window {
  _preview_only_render?(
    type: RenderType,
    files: Sources,
    options?: RenderOptions
  ): unknown;
  _preview_only_inject?(
    brick: string,
    pkg: BrickPackage | BrickPackage[],
    options?: unknown,
    noResolve?: boolean
  ): Promise<void>;
}
