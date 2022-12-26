import loadScript from "./loadScript.js";
import loadSharedModule from "./loadSharedModule.js";

interface BrickPackage {
  id: string;
  filePath: string;
}

export default async function stableLoadBricks(
  bricks: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const bricksByPkg = new Map<string, string[]>();
  for (const brick of bricks) {
    const [namespace, brickName] = brick.split(".");
    let groupBricks = bricksByPkg.get(namespace);
    if (!groupBricks) {
      groupBricks = [];
      bricksByPkg.set(`bricks/${namespace}`, groupBricks);
    }
    groupBricks.push(brickName);
  }

  let foundBasicPkg: BrickPackage | undefined;
  const restPackages: BrickPackage[] = [];
  for (const pkg of brickPackages) {
    if (bricksByPkg.has(pkg.id)) {
      if (pkg.id === "bricks/basic") {
        foundBasicPkg = pkg;
      } else {
        restPackages.push(pkg);
      }
    }
  }
  let waitBasicPkg: Promise<unknown> | undefined;
  let basicPkgPromise: Promise<unknown> | undefined;
  const basicPkg = foundBasicPkg;
  if (basicPkg) {
    const tempPromise = loadScript(basicPkg.filePath);
    // Packages other than BASIC will wait for an extra micro-task tick.
    waitBasicPkg = tempPromise.then(() => Promise.resolve());
    basicPkgPromise = tempPromise.then(() =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      bricksByPkg
        .get(basicPkg.id)!
        .map((brickName) => loadSharedModule(basicPkg.id, `./${brickName}`))
    );
  }

  const pkgPromises = [basicPkgPromise].concat(
    restPackages.map(async (pkg) => {
      await loadScript(pkg.filePath);
      if (waitBasicPkg) {
        await waitBasicPkg;
      }
      return Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bricksByPkg
          .get(pkg.id)!
          .map((brickName) => loadSharedModule(pkg.id, `./${brickName}`))
      );
    })
  );

  await Promise.all(pkgPromises);
}
