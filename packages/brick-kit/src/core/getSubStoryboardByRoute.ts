import {
  BrickConf,
  RouteConf,
  RouteConfOfBricks,
  Storyboard,
} from "@easyops/brick-types";
import { isObject } from "@easyops/brick-utils";

export type SubStoryboardMatcher = (routes: RouteConf[]) => RouteConf[];

export function getSubStoryboardByRoute(
  storyboard: Storyboard,
  matcher: SubStoryboardMatcher
): Storyboard {
  function getSubRoutes(routes: RouteConf[]): RouteConf[] {
    return matcher(routes).map(getSubRoute);
  }

  function getSubRoute(route: RouteConf): RouteConf {
    if (route.type === "routes") {
      return {
        ...route,
        routes: getSubRoutes(route.routes),
      };
    }
    return {
      ...route,
      bricks: getSubBricks((route as RouteConfOfBricks).bricks),
    } as RouteConfOfBricks;
  }

  function getSubBricks(bricks: BrickConf[]): BrickConf[] {
    if (Array.isArray(bricks)) {
      return bricks.map((brickConf) => getSubBrick(brickConf));
    }
    return bricks;
  }

  function getSubBrick(brickConf: BrickConf): BrickConf {
    if (isObject(brickConf.slots)) {
      return {
        ...brickConf,
        slots: Object.fromEntries(
          Object.entries(brickConf.slots).map(([slotId, slotConf]) => {
            if (slotConf.type === "routes") {
              return [
                slotId,
                {
                  ...slotConf,
                  routes: getSubRoutes(slotConf.routes),
                },
              ];
            } /* istanbul ignore else: should never reach */ else if (
              slotConf.type === "bricks"
            ) {
              return [
                slotId,
                {
                  ...slotConf,
                  bricks: getSubBricks(slotConf.bricks),
                },
              ];
            }
            /* istanbul ignore next: should never reach */
            return [slotId, slotConf];
          })
        ),
      };
    }
    return brickConf;
  }

  return {
    ...storyboard,
    routes: getSubRoutes(storyboard.routes),
  };
}
