import { get } from "lodash";
import { Storyboard, RouteConf, RuntimeBrickConf } from "@easyops/brick-types";

function restoreDynamicTemplatesInBrick(brickConf: RuntimeBrickConf): void {
  if (get(brickConf, ["$$lifeCycle", "useResolves"], []).length > 0) {
    const { $$template, $$params, $$lifeCycle } = brickConf;
    Object.keys(brickConf).forEach(key => {
      delete brickConf[key as keyof RuntimeBrickConf];
    });
    Object.assign(brickConf, {
      template: $$template,
      params: $$params,
      lifeCycle: $$lifeCycle
    });
  }
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach(slotConf => {
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
    routes.forEach(routeConf => {
      restoreDynamicTemplatesInBricks(routeConf.bricks);
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
