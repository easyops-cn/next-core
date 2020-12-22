import { Storyboard } from "@easyops/brick-types";
import { scanStoryboard, ScanBricksOptions } from "./scanStoryboard";

export interface CustomApiInfo {
  name: string;
  namespace: string;
}

export function scanCustomApisInStoryboard(
  storyboard: Storyboard,
  options: boolean | ScanBricksOptions = true
): string[] {
  const customApis = scanStoryboard(storyboard, options).customApis;
  return customApis;
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
