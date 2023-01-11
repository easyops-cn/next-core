import {
  BrickConf,
  RouteConf,
  RouteConfOfBricks,
  Storyboard,
} from "@next-core/brick-types";
import { isObject } from "@next-core/brick-utils";

export type SubStoryboardMatcher = (
  routes: RouteConf[]
) => Promise<RouteConf[]>;

export async function getSubStoryboardByRoute(
  storyboard: Storyboard,
  matcher: SubStoryboardMatcher
): Promise<Storyboard> {
  async function getSubRoutes(routes: RouteConf[]): Promise<RouteConf[]> {
    return Promise.all((await matcher(routes)).map(getSubRoute));
  }

  async function getSubRoute(route: RouteConf): Promise<RouteConf> {
    if (route.type === "routes") {
      return {
        ...route,
        routes: await getSubRoutes(route.routes),
      };
    }
    return {
      ...route,
      bricks: await getSubBricks((route as RouteConfOfBricks).bricks),
    } as RouteConfOfBricks;
  }

  async function getSubBricks(bricks: BrickConf[]): Promise<BrickConf[]> {
    if (Array.isArray(bricks)) {
      return Promise.all(bricks.map((brickConf) => getSubBrick(brickConf)));
    }
    return bricks;
  }

  async function getSubBrick(brickConf: BrickConf): Promise<BrickConf> {
    if (isObject(brickConf.slots)) {
      return {
        ...brickConf,
        slots: Object.fromEntries(
          await Promise.all(
            Object.entries(brickConf.slots).map(async ([slotId, slotConf]) => {
              if (slotConf.type === "routes") {
                return [
                  slotId,
                  {
                    ...slotConf,
                    routes: await getSubRoutes(slotConf.routes),
                  },
                ];
              } /* istanbul ignore else: should never reach */ else if (
                slotConf.type === "bricks"
              ) {
                return [
                  slotId,
                  {
                    ...slotConf,
                    bricks: await getSubBricks(slotConf.bricks),
                  },
                ];
              }
              /* istanbul ignore next: should never reach */
              return [slotId, slotConf];
            })
          )
        ),
      };
    }
    return brickConf;
  }

  return {
    ...storyboard,
    routes: await getSubRoutes(storyboard.routes),
  };
}
