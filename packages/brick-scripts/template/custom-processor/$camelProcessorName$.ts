import { getRuntime } from "@next-core/brick-kit";

export function $camelProcessorName$(): any {
  // ...
}

getRuntime().registerCustomProcessor(
  "$camelCasePackageName$.$camelProcessorName$",
  $camelProcessorName$
);
