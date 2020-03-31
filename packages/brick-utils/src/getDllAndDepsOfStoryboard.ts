import { Storyboard, BrickPackage } from "@easyops/brick-types";
import { scanBricksInStoryboard } from "./scanBricksInStoryboard";

interface DllAndDeps {
  dll: string[];
  deps: string[];
}

export function getDllAndDepsOfStoryboard(
  storyboard: Storyboard,
  brickPackages: BrickPackage[]
): DllAndDeps {
  return getDllAndDepsOfBricks(
    scanBricksInStoryboard(storyboard),
    brickPackages
  );
}

export function getDllAndDepsOfBricks(
  bricks: string[],
  brickPackages: BrickPackage[]
): DllAndDeps {
  const dll = new Set<string>();
  const deps: string[] = [];
  const brickSet = new Set(bricks);
  brickPackages.forEach((pkg) => {
    if (pkg.bricks.some((brick) => brickSet.has(brick))) {
      if (pkg.dll) {
        for (const dllName of pkg.dll) {
          let file = `dll-of-${dllName}.js`;
          const dllHash: Record<string, string> = (window as any)["DLL_HASH"];
          if (dllHash && dllHash[dllName]) {
            file += `?${dllHash[dllName]}`;
          }
          dll.add(file);
        }
      }
      deps.push(pkg.filePath);
    }
  });
  return {
    dll: Array.from(dll),
    deps,
  };
}
