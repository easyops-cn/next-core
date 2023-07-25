import { Storyboard, BrickPackage } from "@next-core/brick-types";
import { isEmpty } from "lodash";
import * as changeCase from "change-case";
import { scanProcessorsInAny } from "./scanProcessorsInStoryboard";
import { scanStoryboard, ScanBricksOptions } from "./scanStoryboard";

interface DllAndDeps {
  dll: string[];
  deps: string[];
  v3Bricks?: string[];
  v3Processors?: string[];
}

interface DllAndDepsAndBricks extends DllAndDeps {
  bricks: string[];
  /**
   * Some deps required eager loading, such as processors and widgets.
   */
  eager: DllAndDeps;
}

interface BrickPackageV3 extends BrickPackage {
  id?: string;
  elements?: string[];
}

const widgetRegExp = /\.tpl-/;

export function getDllAndDepsOfStoryboard(
  storyboard: Storyboard,
  brickPackages: BrickPackageV3[],
  options?: ScanBricksOptions
): DllAndDepsAndBricks {
  const { bricks, usedTemplates } = scanStoryboard(storyboard, options);
  const customTemplates = storyboard.meta?.customTemplates;
  const processors = scanProcessorsInAny([
    storyboard.routes,
    options?.ignoreBricksInUnusedCustomTemplates
      ? customTemplates?.filter((tpl) => usedTemplates.includes(tpl.name))
      : customTemplates,
  ]);
  const widgets = bricks.filter((brick) => widgetRegExp.test(brick));
  return {
    ...getDllAndDepsByResource(
      {
        bricks,
        processors,
      },
      brickPackages
    ),
    eager: getDllAndDepsByResource(
      { bricks: widgets, processors },
      brickPackages
    ),
    bricks,
  };
}

function getBrickToPackageMap(
  brickPackages: BrickPackageV3[]
): Map<string, BrickPackageV3> {
  if (isEmpty(brickPackages)) {
    return new Map();
  }

  return brickPackages.reduce((m, item) => {
    if (/^bricks\/.*\/dist\/.*\.js$/.test(item.filePath)) {
      const namespace = item.filePath.split("/")[1];
      m.set(namespace, item);
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unexpected brick package file path: "${item.filePath}"`);
    }

    return m;
  }, new Map());
}

export function getDllAndDepsOfBricks(
  bricks: string[],
  brickPackages: BrickPackageV3[]
): DllAndDeps {
  const dll = new Set<string>();
  const deps = new Set<string>();
  if (bricks.length > 0) {
    const brickMap = getBrickToPackageMap(brickPackages);
    bricks.forEach((brick) => {
      // ignore custom template
      // istanbul ignore else
      if (brick.includes(".")) {
        const namespace = brick.split(".")[0];
        const find = brickMap.get(namespace);
        if (find) {
          deps.add(find.filePath);
          if (find.dll) {
            for (const dllName of find.dll) {
              dll.add(dllName);
            }
          }
        } else {
          // eslint-disable-next-line no-console
          console.error(`Brick \`${brick}\` does not match any brick package`);
        }
      }
    });
  }
  const dllPath = window.DLL_PATH;
  return {
    dll: Array.from(dll).map((dllName) => dllPath[dllName]),
    deps: Array.from(deps),
  };
}

interface StoryboardResource {
  bricks?: string[];
  processors?: string[];
  editorBricks?: string[];
}

export function getDllAndDepsByResource(
  { bricks, processors, editorBricks }: StoryboardResource,
  brickPackages: BrickPackageV3[]
): DllAndDeps {
  const dll = new Set<string>();
  const deps = new Set<string>();
  const v3Bricks = new Set<string>();
  const v3Processors = new Set<string>();

  if (
    bricks?.length > 0 ||
    processors?.length > 0 ||
    editorBricks?.length > 0
  ) {
    const brickMap = getBrickToPackageMap(brickPackages);
    const v3DefinedBricks = new Set<string>();
    for (const pkg of brickPackages) {
      const { id, elements } = pkg;
      if (id && elements?.length) {
        for (const element of elements) {
          v3DefinedBricks.add(element);
        }
      }
    }

    [
      ...(bricks ?? []).map((n) => [n] as [string]),
      ...(processors ?? []).map((n) => [n, true] as [string, boolean?]),
    ].forEach(([name, isProcessor]) => {
      // ignore custom template
      if (name.includes(".")) {
        let namespace = name.split(".")[0];
        // processor 是 camelCase 格式，转成 brick 的 param-case 格式，统一去判断
        if (isProcessor) {
          namespace = changeCase.paramCase(namespace);
        }
        const find = brickMap.get(namespace);
        if (find) {
          if (find.id) {
            (isProcessor ? v3Processors : v3Bricks).add(name);
          } else {
            deps.add(find.filePath);

            if (find.dll) {
              for (const dllName of find.dll) {
                dll.add(dllName);
              }
            }
          }
        } else {
          // eslint-disable-next-line no-console
          console.error(
            `${
              isProcessor ? "Processor" : "Brick"
            } \`${name}\` does not match any brick package`
          );
        }
      } else if (!name.startsWith("tpl-") && v3DefinedBricks.has(name)) {
        v3Bricks.add(name);
      }
    });

    editorBricks?.forEach((editor) => {
      // ignore custom template editor
      // istanbul ignore else
      if (editor.includes(".")) {
        const namespace = editor.split(".")[0];
        const find = brickMap.get(namespace);
        // There maybe no `editorsJsFilePath`.
        if (find) {
          if (find.editorsJsFilePath) {
            deps.add(find.editorsJsFilePath);
            dll.add("editor-bricks-helper");
          }
        } else {
          // eslint-disable-next-line no-console
          console.error(
            `Editor \`${editor}\` does not match any brick package`
          );
        }
      }
    });
  }

  const dllPath = window.DLL_PATH;
  return {
    dll: Array.from(dll).map((dllName) => dllPath[dllName]),
    deps: Array.from(deps),
    v3Bricks: Array.from(v3Bricks),
    v3Processors: Array.from(v3Processors),
  };
}
