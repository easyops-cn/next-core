import { ContextConf, RouteConf } from "@next-core/brick-types";

/**
 * Scan context in storyboard.
 *
 * @param routes - Storyboard.routes.
 * @param context - You can pass an empty array to collect context.
 */
export function scanContextInStoryboard(
  routes: RouteConf[],
  context: ContextConf[]
) {
  for (const item of routes) {
    if (item.context) {
      context.push(...item.context);
    }
    if (item.routes) {
      scanContextInStoryboard(item.routes, context);
    }
  }
}
