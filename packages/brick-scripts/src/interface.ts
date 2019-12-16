export type FileWithContent = [string, string];

export interface AskFlags {
  type?: "libs";
}

export enum TargetType {
  A_NEW_BRICK = "brick",
  A_NEW_PACKAGE_OF_BRICKS = "bricks",
  A_NEW_PACKAGE_OF_LIBS = "libs",
  A_NEW_PACKAGE_OF_MICRO_APPS = "micro-apps",
  A_NEW_CUSTOM_PROVIDER_BRICK = "custom-provider-brick",
  A_NEW_PACKAGE_OF_PROVIDERS = "providers",
  A_NEW_PACKAGE_OF_DLL = "dll",
  TRANSFORM_A_MICRO_APP = "transform",
  A_NEW_TEMPLATE = "template",
  A_NEW_PACKAGE_OF_TEMPLATES = "templates",
  I18N_PATCH_A_PACKAGE_OF_TEMPLATES = "i18n-patch"
}

export const TargetTypeDisplay = {
  [TargetType.A_NEW_BRICK]: "a new brick",
  [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "a new package of bricks",
  [TargetType.A_NEW_PACKAGE_OF_LIBS]: "a new package of libs",
  [TargetType.A_NEW_PACKAGE_OF_MICRO_APPS]: "a new package of micro-apps",
  [TargetType.A_NEW_CUSTOM_PROVIDER_BRICK]: "a new custom provider brick",
  [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "a new package of providers",
  [TargetType.A_NEW_PACKAGE_OF_DLL]: "a new package of dll",
  [TargetType.TRANSFORM_A_MICRO_APP]: "transform a micro-app",
  [TargetType.A_NEW_TEMPLATE]: "a new template",
  [TargetType.A_NEW_PACKAGE_OF_TEMPLATES]: "a new package of templates",
  [TargetType.I18N_PATCH_A_PACKAGE_OF_TEMPLATES]:
    "i18n-patch a package of templates"
};
