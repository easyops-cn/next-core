import { loadBricksImperatively } from "@next-core/loader";

interface BrickPackage {
  id: string;
  filePath: string;
  elements?: string[];
  dependencies?: Record<string, string[]>;
}

const brickPackages = (window.STANDALONE_BRICK_PACKAGES ??=
  []) as BrickPackage[];

export function add(pkgList: BrickPackage[], bricksDir?: string): void {
  brickPackages.push(
    ...(bricksDir
      ? pkgList.map((pkg) => ({
          ...pkg,
          filePath: `${bricksDir}${pkg.filePath}`,
        }))
      : pkgList)
  );
}

export function loadBricks(bricks: string[] | Set<string>): Promise<void> {
  return loadBricksImperatively(bricks, brickPackages);
}
