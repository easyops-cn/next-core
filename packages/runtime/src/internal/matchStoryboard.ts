import type { RuntimeStoryboard } from "@next-core/brick-types";
import { orderBy } from "lodash";

export function matchStoryboard(
  storyboards: RuntimeStoryboard[],
  pathname: string
): RuntimeStoryboard | undefined {
  // Put apps with longer homepage before shorter ones.
  // E.g., `/legacy/tool` will match first before `/legacy`.
  // This enables two apps with relationship of parent-child of homepage.
  const sortedStoryboards = orderBy(
    storyboards,
    (storyboard) => storyboard.app?.homepage?.length ?? 0,
    "desc"
  );
  for (const storyboard of sortedStoryboards) {
    const homepage = storyboard.app.homepage;
    if (typeof homepage === "string" && homepage[0] === "/") {
      if (
        homepage === "/"
          ? pathname === homepage
          : `${pathname.replace(/\/+$/, "")}/`.startsWith(
              `${homepage.replace(/\/+$/, "")}/`
            )
      ) {
        return storyboard;
      }
    }
  }
}

/**
 * We say it's an outside app when at least one of the below conditions are true:
 *   - target app is not found.
 *   - current app is non-standalone mode and target app is standalone mode.
 *
 * Note: when current app is standalone mode, other apps will not be found.
 */
export function isOutsideApp(
  storyboard: RuntimeStoryboard | undefined
): boolean | undefined {
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  return (
    !storyboard ||
    (!window.STANDALONE_MICRO_APPS && storyboard.app.standaloneMode)
  );
}
