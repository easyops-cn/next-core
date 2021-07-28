import { Storyboard } from "@next-core/brick-types";
import { scanStoryboard, ScanBricksOptions } from "./scanStoryboard";

export interface CustomApiInfo {
  name: string;
  namespace: string;
}

export function scanCustomApisInStoryboard(
  storyboard: Storyboard,
  options: boolean | ScanBricksOptions = true
): string[] {
  return scanStoryboard(storyboard, options).customApis;
}

export function mapCustomApisToNameAndNamespace(
  customApis: string[]
): CustomApiInfo[] {
  return customApis.map((v) => {
    const [namespace, name] = v.split("@");
    return {
      namespace,
      name,
    };
  });
}
