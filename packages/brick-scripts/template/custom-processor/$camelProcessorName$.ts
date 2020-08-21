import { getRuntime } from "@easyops/brick-kit";

export function $camelProcessorName$(): any {
  // ...
}

getRuntime().registerCustomProcessor(
  "$camelCasePackageName$.$camelProcessorName$",
  $camelProcessorName$
);
