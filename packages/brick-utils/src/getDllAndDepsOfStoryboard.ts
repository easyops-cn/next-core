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
