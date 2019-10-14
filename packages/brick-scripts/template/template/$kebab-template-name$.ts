import { getRuntime } from "@easyops/brick-kit";
import { BrickConf } from "@easyops/brick-types";

export interface $PascalTemplateParams {}

export function $camelTemplateNameFactory(
  params: $PascalTemplateParams
): BrickConf {
  return {
    brick: "your.brick"
  };
}

getRuntime().registerBrickTemplate(
  "$kebab-package-name$.$kebab-template-name$",
  $camelTemplateNameFactory
);
