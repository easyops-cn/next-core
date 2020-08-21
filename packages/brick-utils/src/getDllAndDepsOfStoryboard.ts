import { Storyboard, BrickPackage } from "@easyops/brick-types";
import { scanBricksInStoryboard } from "./scanBricksInStoryboard";
import { scanProcessorsInStoryboard } from "./scanProcessorsInStoryboard";

interface DllAndDeps {
  dll: string[];
  deps: string[];
}

export function getDllAndDepsOfStoryboard(
  storyboard: Storyboard,
  brickPackages: BrickPackage[]
): DllAndDeps {
  return getDllAndDepsByResource(
    {
      bricks: scanBricksInStoryboard(storyboard),
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
}

export function getDllAndDepsByResource(
  { bricks, processors }: StoryboardResource,
  brickPackages: BrickPackage[]
): DllAndDeps {
  const dll = new Set<string>();
  const deps: string[] = [];
  if (bricks?.length > 0 || processors?.length > 0) {
    const brickSet = new Set(bricks || []);
    const processorSet = new Set(processors || []);
    brickPackages.forEach((pkg) => {
      if (
        pkg.bricks.some((brick) => brickSet.has(brick)) ||
        pkg.processors?.some((item) => processorSet.has(item))
      ) {
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
