import { createProviderClass } from "@next-core/brick-utils";

export interface $PascalBrickName$Params {}

export function $PascalBrickName$(
  params: $PascalBrickName$Params
): Promise<unknown> {
  return null;
}

customElements.define(
  "$kebab-custom-provider-name$",
  createProviderClass($PascalBrickName$)
);
