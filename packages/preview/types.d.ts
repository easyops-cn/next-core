export type RenderType = "html" | "yaml";

export interface Sources {
  yaml?: string;
  html?: string;
}

export interface RenderOptions {
  theme?: string;
  uiVersion?: string;
  context?: string | unknown[];
  templates?: string | unknown[];
  functions?: string | unknown[];
  i18n?: string | object;
  styleText?: string;
  templatesAreArrayOfYaml?: boolean;
}

export interface PreviewWindow {
  _preview_only_render(
    type: RenderType,
    files: Sources,
    options?: RenderOptions
  ): unknown;
}
