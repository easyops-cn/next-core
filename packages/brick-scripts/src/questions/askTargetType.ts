import inquirer from "inquirer";
import { TargetType, TargetTypeDisplay } from "../interface";

export function askTargetType(): inquirer.ListQuestion<{
  targetType: TargetType;
}> {
  // istanbul ignore next (nothing logic)
  return {
    type: "list",
    name: "targetType",
    message: "What do you want?",
    choices: [
      TargetType.A_NEW_BRICK,
      TargetType.A_NEW_CUSTOM_TEMPLATE,
      TargetType.A_NEW_PACKAGE_OF_BRICKS,
      TargetType.A_NEW_PACKAGE_OF_LIBS,
      TargetType.A_NEW_PACKAGE_OF_MICRO_APPS,
      TargetType.A_NEW_CUSTOM_PROVIDER_BRICK,
      TargetType.A_NEW_PACKAGE_OF_PROVIDERS,
      TargetType.A_NEW_LEGACY_TEMPLATE,
      TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES,
      TargetType.A_NEW_PACKAGE_OF_DLL,
      TargetType.TRANSFORM_A_MICRO_APP,
      TargetType.I18N_PATCH_A_PACKAGE_OF_LEGACY_TEMPLATES
    ].map(value => ({
      name: TargetTypeDisplay[value],
      value
    }))
  };
}
