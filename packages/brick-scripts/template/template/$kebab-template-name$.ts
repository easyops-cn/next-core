import { getRuntime } from "@next-core/brick-kit";
import { BrickConf } from "@next-core/brick-types";

export interface $PascalTemplateName$Params {}

export function $camelTemplateName$Factory(
  params: $PascalTemplateName$Params
): BrickConf {
  return {
    brick: "your.brick",
  };
}

getRuntime().registerBrickTemplate(
  "$kebab-package-name$.$kebab-template-name$",
  $camelTemplateName$Factory
);
