import { TargetType } from "./interface";

export const targetMap = {
  [TargetType.A_NEW_BRICK]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_LIBS]: "libs",
  [TargetType.A_NEW_PACKAGE_OF_MICRO_APPS]: "micro-apps",
  [TargetType.A_NEW_CUSTOM_PROVIDER_BRICK]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_DLL]: "dll",
  [TargetType.TRANSFORM_A_MICRO_APP]: "micro-apps",
  [TargetType.A_NEW_TEMPLATE]: "templates",
  [TargetType.A_NEW_PACKAGE_OF_TEMPLATES]: "templates",
  [TargetType.I18N_PATCH_A_PACKAGE_OF_TEMPLATES]: "templates"
};
