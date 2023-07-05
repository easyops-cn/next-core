import type {
  Storyboard,
  BrickConf,
  CustomTemplate,
  UseProviderResolveConf,
  UseProviderEventHandler,
} from "@next-core/brick-types";
import { isObject } from "./isObject";
import {
  type StoryboardNode,
  parseBrick,
  parseStoryboard,
  parseTemplates,
  traverse,
  StoryboardNodeRoot,
} from "@next-core/storyboard";

export interface ScanBricksOptions {
  keepDuplicates?: boolean;
  ignoreBricksInUnusedCustomTemplates?: boolean;
}

/**
 * Scan bricks and custom apis in storyboard.
 *
 * @param storyboard - Storyboard.
 * @param options - If options is a boolean, it means `isUniq` or `de-duplicate`.
 */
export function scanStoryboard(
  storyboard: Storyboard,
  options: boolean | ScanBricksOptions = true
): ReturnType<typeof scanStoryboardAst> {
  const ast = parseStoryboard(storyboard);
  return scanStoryboardAst(ast, options);
}

/**
 * Scan bricks and custom apis in storyboard.
 *
 * @param storyboard - Storyboard.
 * @param options - If options is a boolean, it means `isUniq` or `de-duplicate`.
 */
export function scanStoryboardAst(
  ast: StoryboardNodeRoot,
  options: boolean | ScanBricksOptions = true
): { bricks: string[]; customApis: string[]; usedTemplates: string[] } {
  const { keepDuplicates, ignoreBricksInUnusedCustomTemplates } = isObject(
    options
  )
    ? options
    : ({
        keepDuplicates: !options,
      } as ScanBricksOptions);

  const selfDefined = new Set<string>(["form-renderer.form-renderer"]);
  let collection: Set<string> | string[];

  if (ignoreBricksInUnusedCustomTemplates) {
    collection = collect(ast.routes, keepDuplicates);
    if (Array.isArray(ast.templates)) {
      const tplMap = new Map<string, StoryboardNode>();
      for (const tpl of ast.templates) {
        tplMap.set((tpl.raw as CustomTemplate).name, tpl);
      }
      for (const item of collection) {
        const tpl = tplMap.get(item);
        if (tpl && !selfDefined.has(item)) {
          selfDefined.add(item);
          const collectionByTpl = collect(tpl);
          if (keepDuplicates) {
            (collection as string[]).push(item);
            (collection as string[]).push(...collectionByTpl);
          } else {
            (collection as Set<string>).add(item);
            for (const i of collectionByTpl) {
              (collection as Set<string>).add(i);
            }
          }
        }
      }
    }
  } else {
    collection = collect(ast, keepDuplicates, selfDefined);
  }

  if (keepDuplicates) {
    const bricks: string[] = [];
    const customApis: string[] = [];
    const usedTemplates: string[] = [];
    for (const item of collection) {
      if (item.includes("@")) {
        customApis.push(item);
      } else {
        if (item.includes("-")) {
          (selfDefined.has(item) ? usedTemplates : bricks).push(item);
        }
      }
    }
    return { bricks, customApis, usedTemplates };
  } else {
    const bricks = new Set<string>();
    const customApis = new Set<string>();
    const usedTemplates = new Set<string>();
    for (const item of collection) {
      if (item.includes("@")) {
        customApis.add(item);
      } else {
        if (item.includes("-")) {
          (selfDefined.has(item) ? usedTemplates : bricks).add(item);
        }
      }
    }
    return {
      bricks: [...bricks],
      customApis: [...customApis],
      usedTemplates: [...usedTemplates],
    };
  }
}

function collect(
  nodeOrNodes: StoryboardNode | StoryboardNode[],
  keepDuplicates?: boolean,
  definedTemplates?: Set<string>
): Set<string> | string[] {
  let collection: Set<string> | string[];
  let add: (item: string) => void;
  if (keepDuplicates) {
    collection = [];
    add = (item) => {
      (collection as string[]).push(item);
    };
  } else {
    collection = new Set();
    add = (item) => {
      (collection as Set<string>).add(item);
    };
  }

  traverse(nodeOrNodes, (node) => {
    switch (node.type) {
      case "Brick":
        if (node.raw.brick) {
          add(node.raw.brick);
        }
        break;
      case "Resolvable": {
        const useProvider = (node.raw as UseProviderResolveConf)?.useProvider;
        if (useProvider) {
          add(useProvider);
        }
        break;
      }
      case "EventHandler": {
        const useProvider = (node.raw as UseProviderEventHandler)?.useProvider;
        if (useProvider) {
          add(useProvider);
        }
        break;
      }
      case "Template":
        definedTemplates?.add((node.raw as CustomTemplate).name);
        break;
    }
  });

  return collection;
}

export function collectBricksInBrickConf(brickConf: BrickConf): string[] {
  const node = parseBrick(brickConf);
  return [...collect(node)];
}

export function collectBricksByCustomTemplates(
  customTemplates: CustomTemplate[]
): Map<string, string[]> {
  const collectionByTpl = new Map<string, string[]>();
  const templates = parseTemplates(customTemplates);
  for (const tpl of templates) {
    const collection = collect(tpl, false);
    collectionByTpl.set((tpl.raw as CustomTemplate).name, [...collection]);
  }
  return collectionByTpl;
}
