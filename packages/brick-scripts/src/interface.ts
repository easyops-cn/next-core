export type FileWithContent = [string, string];

export interface AskFlags {
  type?: "libs";
  provider?: "string";
  format?: StoryboardFormat;
}

export enum TargetType {
  A_NEW_BRICK = "brick",
  A_NEW_EDITOR_BRICK = "editor-brick",
  A_NEW_PACKAGE_OF_BRICKS = "bricks",
  A_NEW_PACKAGE_OF_LIBS = "libs",
  A_NEW_PACKAGE_OF_MICRO_APPS = "micro-apps",
  A_NEW_CUSTOM_PROVIDER_BRICK = "custom-provider-brick",
  A_NEW_CUSTOM_PROCESSOR = "custom-processor",
  A_NEW_PACKAGE_OF_PROVIDERS = "providers",
  A_NEW_PACKAGE_OF_DLL = "dll",
  TRANSFORM_A_MICRO_APP = "transform",
  A_NEW_CUSTOM_TEMPLATE = "custom-template",
  A_NEW_LEGACY_TEMPLATE = "legacy-template",
  A_NEW_PACKAGE_OF_LEGACY_TEMPLATES = "legacy-templates",
  I18N_PATCH_A_PACKAGE_OF_LEGACY_TEMPLATES = "i18n-patch",
}

export const TargetTypeDisplay = {
  [TargetType.A_NEW_BRICK]: "A new brick",
  [TargetType.A_NEW_EDITOR_BRICK]: "A new editor brick",
  [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "A new package of bricks",
  [TargetType.A_NEW_PACKAGE_OF_LIBS]: "A new package of libs",
  [TargetType.A_NEW_PACKAGE_OF_MICRO_APPS]: "A new package of micro-apps",
  [TargetType.A_NEW_CUSTOM_PROVIDER_BRICK]: "A new custom provider brick",
  [TargetType.A_NEW_CUSTOM_PROCESSOR]: "A new custom processor",
  [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "A new package of providers",
  [TargetType.A_NEW_PACKAGE_OF_DLL]: "A new package of dll",
  [TargetType.TRANSFORM_A_MICRO_APP]: "Transform a micro-app to use TypeScript",
  [TargetType.A_NEW_CUSTOM_TEMPLATE]: "A new custom template",
  [TargetType.A_NEW_LEGACY_TEMPLATE]: "A new legacy template",
  [TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES]:
    "A new package of legacy templates",
  [TargetType.I18N_PATCH_A_PACKAGE_OF_LEGACY_TEMPLATES]:
    "I18n-patch a package of legacy templates",
};

export enum StoryboardFormat {
  YAML = "yaml",
  JSON = "json",
  TYPESCRIPT = "TypeScript",
}
