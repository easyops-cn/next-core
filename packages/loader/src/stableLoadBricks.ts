import loadScript from "./loadScript.js";
import loadSharedModule from "./loadSharedModule.js";

interface BrickPackage {
  id: string;
  filePath: string;
}

let resolveBasicPkg: () => void;
let basicPkgWillBeResolved = false;
const waitBasicPkg = new Promise<void>((resolve) => {
  resolveBasicPkg = resolve;
});

export function flushStableLoadBricks(): void {
  if (!basicPkgWillBeResolved) {
    resolveBasicPkg();
  }
}

/**
 * When loading bundles with webpack module federation concurrently, if
 * these bundles share some modules, webpack will load a singleton module
 * if versions are matched. Webpack will use the first bundle who started
 * to init the shared scope. Generally which bundle to use for a specific
 * module, does not matter. However, it may cause flaky result since the
 * shared module may from different bundles which maybe not exactly the
 * same, especially developers declare dependencies incorrectly sometimes.
 * So in order to make it less flaky, we try to make a BASIC package takes
 * precedence over others. We will always load the shared modules from the
 * basic package bundle if it contains the shared modules.
 */
export async function enqueueStableLoadBricks(
  bricks: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const bricksByPkg = new Map<string, string[]>();
  for (const brick of bricks) {
    const [namespace, brickName] = brick.split(".");
    const groupName = `bricks/${namespace}`;
    let groupBricks = bricksByPkg.get(groupName);
    if (!groupBricks) {
      groupBricks = [];
      bricksByPkg.set(groupName, groupBricks);
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

  let basicPkgPromise: Promise<unknown> | undefined;
  const basicPkg = foundBasicPkg;
  if (basicPkg) {
    const tempPromise = loadScript(basicPkg.filePath);
    // Packages other than BASIC will wait for an extra micro-task tick.
    if (!basicPkgWillBeResolved) {
      basicPkgWillBeResolved = true;
      tempPromise.then(() => Promise.resolve()).then(resolveBasicPkg);
    }
    basicPkgPromise = tempPromise.then(() =>
      Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bricksByPkg
          .get(basicPkg.id)!
          .map((brickName) => loadSharedModule(basicPkg.id, `./${brickName}`))
      )
    );
  }

  const pkgPromises = [basicPkgPromise].concat(
    restPackages.map(async (pkg) => {
      await loadScript(pkg.filePath);
      await waitBasicPkg;
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
