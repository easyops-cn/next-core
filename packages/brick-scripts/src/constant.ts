import { TargetType } from "./interface";

export const targetMap = {
  [TargetType.A_NEW_BRICK]: "bricks",
  [TargetType.A_NEW_CUSTOM_TEMPLATE]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_BRICKS]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_LIBS]: "libs",
  [TargetType.A_NEW_CUSTOM_PROVIDER]: "bricks",
  [TargetType.A_NEW_CUSTOM_PROCESSOR]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_PROVIDERS]: "bricks",
  [TargetType.A_NEW_PACKAGE_OF_DLL]: "dll",
};
