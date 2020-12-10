import { Storyboard, BrickPackage } from "@easyops/brick-types";
import {
  scanBricksInStoryboard,
  ScanBricksOptions,
} from "./scanBricksInStoryboard";
import { scanProcessorsInStoryboard } from "./scanProcessorsInStoryboard";

interface DllAndDeps {
  dll: string[];
  deps: string[];
}

export function getDllAndDepsOfStoryboard(
  storyboard: Storyboard,
  brickPackages: BrickPackage[],
  options?: ScanBricksOptions
): DllAndDeps {
  return getDllAndDepsByResource(
    {
      bricks: scanBricksInStoryboard(storyboard, options),
      processors: scanProcessorsInStoryboard(storyboard),
    },
    brickPackages
  );
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
  const dllHash: Record<string, string> = (window as any)["DLL_HASH"];
  return {
    dll: Array.from(dll).map((dllName) => {
      let file = `dll-of-${dllName}.js`;
      if (dllHash?.[dllName]) {
        file += `?${dllHash[dllName]}`;
      }
      return file;
    }),
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
        // Editor bricks have a constant dll of `@dll/editor-bricks-helper`.
        dll.add("editor-bricks-helper");
        deps.push(pkg.editorsJsFilePath);
      }
    });
  }
  const dllHash: Record<string, string> = (window as any)["DLL_HASH"];
  return {
    dll: Array.from(dll).map((dllName) => {
      let file = `dll-of-${dllName}.js`;
      if (dllHash?.[dllName]) {
        file += `?${dllHash[dllName]}`;
      }
      return file;
    }),
    deps,
  };
}
