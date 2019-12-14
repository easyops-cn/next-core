import { createProviderClass } from "@easyops/brick-utils";

export interface $PascalBrickName$Params {}

export function $PascalBrickName$(
  params: $PascalBrickName$Params
): Promise<any> {
  return null;
}

customElements.define(
  "$kebab-custom-provider-brick-name$",
  createProviderClass($PascalBrickName$)
);
