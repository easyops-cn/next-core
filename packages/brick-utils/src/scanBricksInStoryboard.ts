import { Storyboard, BrickConf } from "@next-core/brick-types";
import { scanStoryboard, collectBricksInBrickConf } from "./scanStoryboard";

export interface ScanBricksOptions {
  keepDuplicates?: boolean;
  ignoreBricksInUnusedCustomTemplates?: boolean;
}

/**
 * Scan bricks in storyboard.
 *
 * @param storyboard - Storyboard.
 * @param options - If options is a boolean, it means `isUniq` or `de-duplicate`.
 * @param collectionOfCustomApi - You can pass an empty array to collect custom api.
 */
export function scanBricksInStoryboard(
  storyboard: Storyboard,
  options: boolean | ScanBricksOptions = true
): string[] {
  return scanStoryboard(storyboard, options).bricks;
}

export function scanBricksInBrickConf(brickConf: BrickConf): string[] {
  const collection = collectBricksInBrickConf(brickConf);
  const result = collection.filter(
    (item) => !item.includes("@") && item.includes("-")
  );
  return result;
}
