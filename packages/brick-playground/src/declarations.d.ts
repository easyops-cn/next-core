type RenderType = "html" | "yaml";

interface Sources {
  yaml?: string;
  html?: string;
  javascript?: string;
}

interface RenderOptions {
  theme?: string;
  context?: string | unknown[];
  templates?: string | unknown[];
  functions?: string | unknown[];
  i18n?: string | object;
  styleText?: string;
  templatesAreArrayOfYaml?: boolean;
}

interface Window {
  EXAMPLES_FILE?: string;
  _preview_only_render(
    type: RenderType,
    files: Sources,
    options?: RenderOptions
  ): unknown;
}
