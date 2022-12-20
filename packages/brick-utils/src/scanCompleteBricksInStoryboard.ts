import { BrickConf, RouteConf } from "@next-core/brick-types";

/**
 * Scan complete bricks in storyboard.
 *
 * @param routes - Storyboard.routes.
 * @param completeBricks - You can pass an empty array to collect complete bricks.
 */
export function scanCompleteBricksInStoryboard(
  routes: RouteConf[],
  completeBricks: BrickConf[]
) {
  for (const item of routes) {
    if (item.bricks) {
      completeBricks.push(...item.bricks);
    }
    if (item.routes) {
      scanCompleteBricksInStoryboard(item.routes, completeBricks);
    }
  }
}
