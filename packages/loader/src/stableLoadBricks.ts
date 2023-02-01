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
export function enqueueStableLoadBricks(
  bricks: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  return enqueueStableLoad("bricks", bricks, brickPackages);
}

export function enqueueStableLoadProcessors(
  processors: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  return enqueueStableLoad("processors", processors, brickPackages);
}

export function loadBricksImperatively(
  bricks: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("bricks", bricks, brickPackages);
  flushStableLoadBricks();
  return promise;
}

export function loadProcessorsImperatively(
  processors: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("processors", processors, brickPackages);
  flushStableLoadBricks();
  return promise;
}

async function enqueueStableLoad(
  type: "bricks" | "processors",
  list: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const moduleDir = type === "processors" ? "./processors/" : "./";
  const modulesByPkg = new Map<string, string[]>();
  for (const item of list) {
    const [namespace, itemName] = item.split(".");
    const pkgId = `bricks/${
      type === "processors" ? getProcessorPackageName(namespace) : namespace
    }`;
    let groupModules = modulesByPkg.get(pkgId);
    if (!groupModules) {
      groupModules = [];
      modulesByPkg.set(pkgId, groupModules);
    }
    groupModules.push(`${moduleDir}${itemName}`);
  }

  let foundBasicPkg: BrickPackage | undefined;
  const restPackages: BrickPackage[] = [];
  for (const pkg of brickPackages) {
    if (modulesByPkg.has(pkg.id)) {
      if (pkg.id === "bricks/basic") {
        foundBasicPkg = pkg;
      } else {
        restPackages.push(pkg);
      }
    }
  }

  const loadBrickModule = async (pkgId: string, moduleName: string) => {
    try {
      await loadSharedModule(pkgId, moduleName);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      throw new Error(
        `Load ${type} of "${pkgId.split("/").pop()}.${moduleName
          .split("/")
          .pop()}" failed`
      );
    }
  };

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
        modulesByPkg
          .get(basicPkg.id)!
          .map((moduleName) => loadBrickModule(basicPkg.id, moduleName))
      )
    );
  }

  const pkgPromises = [basicPkgPromise].concat(
    restPackages.map(async (pkg) => {
      await loadScript(pkg.filePath);
      await waitBasicPkg;
      return Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        modulesByPkg
          .get(pkg.id)!
          .map((moduleName) => loadBrickModule(pkg.id, moduleName))
      );
    })
  );

  await Promise.all(pkgPromises);
}

function getProcessorPackageName(camelPackageName: string): string {
  return camelPackageName
    .replace(/[A-Z]/g, (match) => `-${match[0].toLocaleLowerCase()}`)
    .replace(/_[0-9]/g, (match) => `-${match[1]}`);
}
