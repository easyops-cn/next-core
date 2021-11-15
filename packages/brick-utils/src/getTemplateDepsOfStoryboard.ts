import {
  Storyboard,
  RouteConf,
  BrickConf,
  TemplatePackage,
  RouteConfOfBricks,
} from "@next-core/brick-types";
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
  const templateMap: Map<string, TemplatePackage> = templatePackages.reduce(
    (m, item) => {
      if (/^templates\/.*\/dist\/.*\.js$/.test(item.filePath)) {
        const namespace = item.filePath.split("/")[1];
        m.set(namespace, item);
      } else {
        // eslint-disable-next-line no-console
        console.error(
          `the file path of template is \`${item.filePath}\` and it is non-standard format`
        );
      }
      return m;
    },
    new Map()
  );

  return templates.reduce((arr, template) => {
    const namespace = template.split(".")?.[0];
    const find = templateMap.get(namespace);
    if (find) {
      arr.push(find.filePath);
    } else {
      // eslint-disable-next-line no-console
      console.error(
        `the name of template is \`${template}\` and it don't match any template package`
      );
    }

    return arr;
  }, []);
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
