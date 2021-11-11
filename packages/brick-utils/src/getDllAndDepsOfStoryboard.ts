import { Storyboard, BrickPackage } from "@next-core/brick-types";
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

export function getDllAndDepsOfBricks(
  bricks: string[],
  brickPackages: BrickPackage[]
): DllAndDeps {
  const dll = new Set<string>();
  const deps: string[] = [];
  if (bricks.length > 0) {
    const brickSet = new Set(bricks);
    brickPackages.forEach((pkg) => {
      if (pkg.bricks.some((brick) => brickSet.has(brick))) {
        if (pkg.dll) {
          for (const dllName of pkg.dll) {
            dll.add(dllName);
          }
        }
        deps.push(pkg.filePath);
      }
    });
  }
  const dllPath = window.DLL_PATH;
  return {
    dll: Array.from(dll).map((dllName) => dllPath[dllName]),
    deps,
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
  const deps: string[] = [];
  if (
    bricks?.length > 0 ||
    processors?.length > 0 ||
    editorBricks?.length > 0
  ) {
    const brickSet = new Set(bricks || []);
    const processorSet = new Set(processors || []);
    const editorBrickSet = new Set(editorBricks || []);
    brickPackages.forEach((pkg) => {
      const hasBricks = pkg.bricks.some((brick) => brickSet.has(brick));
      const hasProcessors = pkg.processors?.some((item) =>
        processorSet.has(item)
      );
      const hasEditorBricks = pkg.editors?.some((item) =>
        editorBrickSet.has(item)
      );
      if (hasBricks || hasProcessors) {
        if (pkg.dll) {
          for (const dllName of pkg.dll) {
            dll.add(dllName);
          }
        }
        deps.push(pkg.filePath);
      }
      if (hasEditorBricks) {
        // Editor bricks have a constant dll of `@next-dll/editor-bricks-helper`.
        dll.add("editor-bricks-helper");
        deps.push(pkg.editorsJsFilePath);
      }
    });
  }
  const dllPath = window.DLL_PATH;
  return {
    dll: Array.from(dll).map((dllName) => dllPath[dllName]),
    deps,
  };
}
