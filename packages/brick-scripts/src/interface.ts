export type FileWithContent = [string, string];

export interface AskFlags {
  type?: "libs";
}

export enum TargetType {
  A_NEW_BRICK = "brick",
  A_NEW_PACKAGE_OF_BRICKS = "bricks",
  A_NEW_PACKAGE_OF_LIBS = "libs",
  A_NEW_PACKAGE_OF_MICRO_APPS = "micro-apps",
  A_NEW_PACKAGE_OF_PROVIDERS = "providers",
  A_NEW_PACKAGE_OF_DLL = "dll",
  TRANSFORM_A_MICRO_APP = "transform"
}

export const TargetTypeDisplay = {
  [TargetType.A_NEW_BRICK]: "a new brick",
  [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "a new package of bricks",
  [TargetType.A_NEW_PACKAGE_OF_LIBS]: "a new package of libs",
  [TargetType.A_NEW_PACKAGE_OF_MICRO_APPS]: "a new package of micro-apps",
  [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "a new package of providers",
  [TargetType.A_NEW_PACKAGE_OF_DLL]: "a new package of dll",
  [TargetType.TRANSFORM_A_MICRO_APP]: "transform a micro-app"
};
