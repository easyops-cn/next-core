import {
  Storyboard,
  RouteConf,
  BrickConf,
  BrickTemplateFactory,
  TemplateRegistry,
  TemplatePackage
} from "@easyops/brick-types";
import { loadScript } from "./loadScript";
import { getDepsOfTemplates } from "./getTemplateDepsOfStoryboard";

export async function asyncProcessBrick(
  brickConf: BrickConf,
  templateRegistry: TemplateRegistry<BrickTemplateFactory>,
  templatePackages: TemplatePackage[]
): Promise<void> {
  if (brickConf.template) {
    let updatedBrickConf: Partial<BrickConf> = {};
    if (!templateRegistry.has(brickConf.template)) {
      await loadScript(
        getDepsOfTemplates([brickConf.template], templatePackages)
      );
    }
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
    await Promise.all(
      Object.values(brickConf.slots).map(async slotConf => {
        if (slotConf.type === "bricks") {
          await asyncProcessBricks(
            slotConf.bricks,
            templateRegistry,
            templatePackages
          );
        } else {
          await asyncProcessRoutes(
            slotConf.routes,
            templateRegistry,
            templatePackages
          );
        }
      })
    );
  }
}

async function asyncProcessBricks(
  bricks: BrickConf[],
  templateRegistry: TemplateRegistry<BrickTemplateFactory>,
  templatePackages: TemplatePackage[]
): Promise<void> {
  if (Array.isArray(bricks)) {
    await Promise.all(
      bricks.map(async brickConf => {
        await asyncProcessBrick(brickConf, templateRegistry, templatePackages);
      })
    );
  }
}

async function asyncProcessRoutes(
  routes: RouteConf[],
  templateRegistry: TemplateRegistry<BrickTemplateFactory>,
  templatePackages: TemplatePackage[]
): Promise<void> {
  if (Array.isArray(routes)) {
    await Promise.all(
      routes.map(async routeConf => {
        await asyncProcessBricks(
          routeConf.bricks,
          templateRegistry,
          templatePackages
        );
        const brickConf = routeConf.menu;
        if (brickConf && brickConf.type === "brick") {
          await asyncProcessBrick(
            brickConf,
            templateRegistry,
            templatePackages
          );
        }
      })
    );
  }
}

export async function asyncProcessStoryboard(
  storyboard: Storyboard,
  templateRegistry: TemplateRegistry<BrickTemplateFactory>,
  templatePackages: TemplatePackage[]
): Promise<Storyboard> {
  await asyncProcessRoutes(
    storyboard.routes,
    templateRegistry,
    templatePackages
  );
  return storyboard;
}
