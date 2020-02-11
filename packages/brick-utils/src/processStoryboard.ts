import {
  Storyboard,
  RouteConf,
  BrickConf,
  BrickTemplateFactory,
  TemplateRegistry,
  RuntimeBrickConf,
  RouteConfOfBricks
} from "@easyops/brick-types";

export function processBrick(
  brickConf: BrickConf,
  templateRegistry: TemplateRegistry<BrickTemplateFactory>
): void {
  if (brickConf.template) {
    if (
      !(brickConf as RuntimeBrickConf).$$resolved &&
      brickConf.lifeCycle &&
      brickConf.lifeCycle.useResolves &&
      brickConf.lifeCycle.useResolves.length > 0
    ) {
      (brickConf as RuntimeBrickConf).$$dynamic = true;
    } else {
      let updatedBrickConf: Partial<BrickConf> = {};
      if (templateRegistry.has(brickConf.template)) {
        updatedBrickConf = templateRegistry.get(brickConf.template)(
          brickConf.params
        );
      } else {
        updatedBrickConf = {
          brick: "basic-bricks.page-error",
          properties: {
            error: `Template not found: ${brickConf.template}`
          }
        };
      }
      // 清理 brickConf.
      const { template, params, lifeCycle } = brickConf;
      Object.keys(brickConf).forEach(key => {
        delete brickConf[key as keyof BrickConf];
      });
      Object.assign(brickConf, updatedBrickConf, {
        // For debugging.
        $$template: template,
        $$params: params,
        $$lifeCycle: lifeCycle
      });
    }
  }
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach(slotConf => {
      if (slotConf.type === "bricks") {
        processBricks(slotConf.bricks, templateRegistry);
      } else {
        processRoutes(slotConf.routes, templateRegistry);
      }
    });
  }
}

function processBricks(
  bricks: BrickConf[],
  templateRegistry: TemplateRegistry<BrickTemplateFactory>
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach(brickConf => {
      processBrick(brickConf, templateRegistry);
    });
  }
}

function processRoutes(
  routes: RouteConf[],
  templateRegistry: TemplateRegistry<BrickTemplateFactory>
): void {
  if (Array.isArray(routes)) {
    routes.forEach(routeConf => {
      if (routeConf.type === "routes") {
        processRoutes(routeConf.routes, templateRegistry);
      } else {
        processBricks(
          (routeConf as RouteConfOfBricks).bricks,
          templateRegistry
        );
      }
      const brickConf = routeConf.menu;
      if (brickConf && brickConf.type === "brick") {
        processBrick(brickConf, templateRegistry);
      }
    });
  }
}

export function processStoryboard(
  storyboard: Storyboard,
  templateRegistry: TemplateRegistry<BrickTemplateFactory>
): Storyboard {
  processRoutes(storyboard.routes, templateRegistry);
  return storyboard;
}
