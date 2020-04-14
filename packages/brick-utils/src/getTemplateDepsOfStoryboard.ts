import {
  Storyboard,
  RouteConf,
  BrickConf,
  TemplatePackage,
  RouteConfOfBricks,
} from "@easyops/brick-types";
import { uniq } from "lodash";

export function scanTemplatesInBrick(
  brickConf: BrickConf,
  collection: string[]
): void {
  if (brickConf.template) {
    collection.push(brickConf.template);
  }
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach((slotConf) => {
      if (slotConf.type === "bricks") {
        scanTemplatesInBricks(slotConf.bricks, collection);
      } else {
        scanTemplatesInRoutes(slotConf.routes, collection);
      }
    });
  }
  if (Array.isArray(brickConf.internalUsedTemplates)) {
    brickConf.internalUsedTemplates.forEach((template) => {
      collection.push(template);
    });
  }
}

function scanTemplatesInBricks(
  bricks: BrickConf[],
  collection: string[]
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach((brickConf) => {
      scanTemplatesInBrick(brickConf, collection);
    });
  }
}

function scanTemplatesInRoutes(
  routes: RouteConf[],
  collection: string[]
): void {
  if (Array.isArray(routes)) {
    routes.forEach((routeConf) => {
      if (routeConf.type === "routes") {
        scanTemplatesInRoutes(routeConf.routes, collection);
      } else {
        scanTemplatesInBricks(
          (routeConf as RouteConfOfBricks).bricks,
          collection
        );
      }
      const brickConf = routeConf.menu;
      if (brickConf && brickConf.type === "brick") {
        scanTemplatesInBrick(brickConf, collection);
      }
    });
  }
}

export function scanTemplatesInStoryboard(
  storyboard: Storyboard,
  isUniq = true
): string[] {
  const collection: string[] = [];
  scanTemplatesInRoutes(storyboard.routes, collection);
  return isUniq ? uniq(collection) : collection;
}

export function getDepsOfTemplates(
  templates: string[],
  templatePackages: TemplatePackage[]
): string[] {
  const templateSet = new Set(templates);
  return templatePackages
    .filter((pkg) =>
      pkg.templates.some((template) => templateSet.has(template))
    )
    .map((pkg) => pkg.filePath);
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
