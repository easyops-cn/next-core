import { Storyboard, BrickPackage } from "@next-core/brick-types";
import { isEmpty } from "lodash";
import * as changeCase from "change-case";
import { scanProcessorsInAny } from "./scanProcessorsInStoryboard";
import { scanStoryboard, ScanBricksOptions } from "./scanStoryboard";

interface DllAndDeps {
  dll: string[];
  deps: string[];
}

interface DllAndDepsAndBricks extends DllAndDeps {
  bricks: string[];
  byProcessors: DllAndDeps;
}

export function getDllAndDepsOfStoryboard(
  storyboard: Storyboard,
  brickPackages: BrickPackage[],
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
  return {
    ...getDllAndDepsByResource(
      {
        bricks,
        processors,
      },
      brickPackages
    ),
    byProcessors: getDllAndDepsByResource({ processors }, brickPackages),
    bricks,
  };
}

function getBrickToPackageMap(
  brickPackages: BrickPackage[]
): Map<string, BrickPackage> {
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
  brickPackages: BrickPackage[]
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
  brickPackages: BrickPackage[]
): DllAndDeps {
  const dll = new Set<string>();
  const deps = new Set<string>();

  if (
    bricks?.length > 0 ||
    processors?.length > 0 ||
    editorBricks?.length > 0
  ) {
    const brickMap = getBrickToPackageMap(brickPackages);

    [...(bricks ?? []), ...(processors ?? [])].forEach((name) => {
      // ignore custom template
      // istanbul ignore else
      if (name.includes(".")) {
        let namespace = name.split(".")[0];
        const isProcessor = processors?.includes(name);

        // processor 是 camelCase 格式，转成 brick 的 param-case 格式，统一去判断
        if (isProcessor) {
          namespace = changeCase.paramCase(namespace);
        }
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
          console.error(
            `${
              isProcessor ? "Processor" : "Brick"
            } \`${name}\` does not match any brick package`
          );
        }
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
  };
}
