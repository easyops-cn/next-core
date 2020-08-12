import { get } from "lodash";
import {
  Storyboard,
  RouteConf,
  RuntimeBrickConf,
  RouteConfOfBricks,
} from "@easyops/brick-types";
import { hasOwnProperty } from "./hasOwnProperty";

function restoreDynamicTemplatesInBrick(brickConf: RuntimeBrickConf): void {
  if (get(brickConf, ["$$lifeCycle", "useResolves"], []).length > 0) {
    const { $$template, $$params, $$lifeCycle } = brickConf;
    const hasIf = hasOwnProperty(brickConf, "$$if");
    const rawIf = brickConf.$$if;
    Object.keys(brickConf).forEach((key) => {
      delete brickConf[key as keyof RuntimeBrickConf];
    });
    Object.assign(
      brickConf,
      {
        template: $$template,
        params: $$params,
        lifeCycle: $$lifeCycle,
      },
      hasIf ? { if: rawIf } : {}
    );
  }
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach((slotConf) => {
      if (slotConf.type === "bricks") {
        restoreDynamicTemplatesInBricks(slotConf.bricks);
      } else {
        restoreDynamicTemplatesInRoutes(slotConf.routes);
      }
    });
  }
}

function restoreDynamicTemplatesInBricks(bricks: RuntimeBrickConf[]): void {
  if (Array.isArray(bricks)) {
    bricks.forEach(restoreDynamicTemplatesInBrick);
  }
}

function restoreDynamicTemplatesInRoutes(routes: RouteConf[]): void {
  if (Array.isArray(routes)) {
    routes.forEach((routeConf) => {
      if (routeConf.type === "routes") {
        restoreDynamicTemplatesInRoutes(routeConf.routes);
      } else {
        restoreDynamicTemplatesInBricks(
          (routeConf as RouteConfOfBricks).bricks
        );
      }
      const menuBrickConf = routeConf.menu;
      if (menuBrickConf && menuBrickConf.type === "brick") {
        restoreDynamicTemplatesInBrick(menuBrickConf);
      }
    });
  }
}

export function restoreDynamicTemplates(storyboard: Storyboard): void {
  restoreDynamicTemplatesInRoutes(storyboard.routes);
}
