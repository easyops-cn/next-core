import {
  Storyboard,
  RouteConf,
  BrickConf,
  TemplatePackage
} from "@easyops/brick-types";

export function scanTemplatesInBrick(
  brickConf: BrickConf,
  collection: Set<string>
): void {
  if (brickConf.template) {
    collection.add(brickConf.template);
  }
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach(slotConf => {
      if (slotConf.type === "bricks") {
        scanTemplatesInBricks(slotConf.bricks, collection);
      } else {
        scanTemplatesInRoutes(slotConf.routes, collection);
      }
    });
  }
  if (Array.isArray(brickConf.internalUsedTemplates)) {
    brickConf.internalUsedTemplates.forEach(template => {
      collection.add(template);
    });
  }
}

function scanTemplatesInBricks(
  bricks: BrickConf[],
  collection: Set<string>
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach(brickConf => {
      scanTemplatesInBrick(brickConf, collection);
    });
  }
}

function scanTemplatesInRoutes(
  routes: RouteConf[],
  collection: Set<string>
): void {
  if (Array.isArray(routes)) {
    routes.forEach(routeConf => {
      scanTemplatesInBricks(routeConf.bricks, collection);
      const brickConf = routeConf.menu;
      if (brickConf && brickConf.type === "brick") {
        scanTemplatesInBrick(brickConf, collection);
      }
    });
  }
}

export function scanTemplatesInStoryboard(storyboard: Storyboard): string[] {
  const collection = new Set<string>();
  scanTemplatesInRoutes(storyboard.routes, collection);
  return Array.from(collection);
}

export function getDepsOfTemplates(
  templates: string[],
  templatePackages: TemplatePackage[]
): string[] {
  const templateSet = new Set(templates);
  return templatePackages
    .filter(pkg => pkg.templates.some(template => templateSet.has(template)))
    .map(pkg => pkg.filePath);
}

export function getTemplateDepsOfStoryboard(
  storyboard: Storyboard,
  templatePackages: TemplatePackage[]
): string[] {
  return getDepsOfTemplates(
    scanTemplatesInStoryboard(storyboard),
    templatePackages
  );
}
