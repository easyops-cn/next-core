import {
  Storyboard,
  RouteConf,
  BrickConf,
  BrickTemplateFactory,
  TemplateRegistry
} from "@easyops/brick-types";

export function processBrick(
  brickConf: BrickConf,
  templateRegistry: TemplateRegistry<BrickTemplateFactory>
): void {
  if (brickConf.template) {
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
    Object.assign(brickConf, updatedBrickConf, {
      $template: brickConf.template,
      $params: brickConf.params
    });
    delete brickConf.template;
    delete brickConf.params;
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
      processBricks(routeConf.bricks, templateRegistry);
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
