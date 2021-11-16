import { Storyboard, BrickPackage } from "@next-core/brick-types";
import { isEmpty } from "lodash";
import * as changeCase from "change-case";
import {
  scanBricksInStoryboard,
  ScanBricksOptions,
} from "./scanBricksInStoryboard";
import { scanProcessorsInStoryboard } from "./scanProcessorsInStoryboard";

interface DllAndDeps {
  dll: string[];
  deps: string[];
}

interface DllAndDepsAndBricks extends DllAndDeps {
  bricks: string[];
}

export function getDllAndDepsOfStoryboard(
  storyboard: Storyboard,
  brickPackages: BrickPackage[],
  options?: ScanBricksOptions
): DllAndDepsAndBricks {
  const bricks = scanBricksInStoryboard(storyboard, options);
  return {
    ...getDllAndDepsByResource(
      {
        bricks,
        processors: scanProcessorsInStoryboard(storyboard),
      },
      brickPackages
    ),
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
      console.error(
        `the file path of brick is \`${item.filePath}\` and it is non-standard package path`
      );
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
          console.error(
            `the name of brick is \`${brick}\` and it don't match any brick package`
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
            `the name of ${
              isProcessor ? "processor" : "brick"
            } is \`${name}\` and it don't match any package`
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
        if (find) {
          deps.add(find.editorsJsFilePath);
          dll.add("editor-bricks-helper");
        } else {
          // eslint-disable-next-line no-console
          console.error(
            `the name of editor is \`${editor}\` and it don't match any editor package`
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
