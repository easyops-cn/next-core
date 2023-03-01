import loadScript from "./loadScript.js";
import loadSharedModule from "./loadSharedModule.js";

interface BrickPackage {
  id: string;
  filePath: string;
  dependencies?: Record<string, string[]>;
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
  const promise = enqueueStableLoad("bricks", bricks, brickPackages);
  dispatchRequestStatus(promise);
  return promise;
}

export function enqueueStableLoadProcessors(
  processors: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("processors", processors, brickPackages);
  dispatchRequestStatus(promise);
  return promise;
}

export function loadBricksImperatively(
  bricks: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("bricks", bricks, brickPackages);
  flushStableLoadBricks();
  dispatchRequestStatus(promise);
  return promise;
}

export function loadProcessorsImperatively(
  processors: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("processors", processors, brickPackages);
  flushStableLoadBricks();
  dispatchRequestStatus(promise);
  return promise;
}

interface V2AdapterBrick {
  resolve(
    adapterPkgFilePath: string,
    brickPkgFilePath: string,
    bricks: string[],
    dlls?: string[]
  ): Promise<void>;
}

let v2AdapterPromise: Promise<V2AdapterBrick> | undefined;

async function enqueueStableLoad(
  type: "bricks" | "processors",
  list: Iterable<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const moduleDir = type === "processors" ? "./processors/" : "./";
  const modulesByPkg = new Map<string, string[]>();

  const listToLoad = new Set<string>();
  const add = (item: string) => {
    if (listToLoad.has(item)) {
      return;
    }
    listToLoad.add(item);
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

    // Load their dependencies too
    const pkg = brickPackages.find((p) => p.id === pkgId);
    const deps = pkg?.dependencies?.[item];
    if (deps) {
      for (const dep of deps) {
        add(dep);
      }
    }
  };
  for (const item of list) {
    add(item);
  }

  let foundBasicPkg: BrickPackage | undefined;
  const v2Packages: BrickPackage[] = [];
  const restPackages: BrickPackage[] = [];
  let maybeV2Adapter: BrickPackage | undefined;
  for (const pkg of brickPackages) {
    if (!pkg.id) {
      // Brick packages of v2 has no `id`
      const pkgId = pkg.filePath.split("/").slice(0, 2).join("/");
      if (modulesByPkg.has(pkgId)) {
        v2Packages.push(pkg);
        maybeV2Adapter = brickPackages.find(
          (pkg) => pkg.id === "bricks/v2-adapter"
        );
        if (!maybeV2Adapter) {
          // eslint-disable-next-line no-console
          console.error("Using v2 bricks, but v2-adapter not found");
        }
      }
    } else if (modulesByPkg.has(pkg.id)) {
      if (pkg.id === "bricks/basic") {
        foundBasicPkg = pkg;
      } else {
        restPackages.push(pkg);
      }
    }
  }
  const v2Adapter = maybeV2Adapter;

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
    const tempPromise = loadScript(basicPkg.filePath, window.PUBLIC_ROOT ?? "");
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
      await loadScript(pkg.filePath, window.PUBLIC_ROOT ?? "");
      await waitBasicPkg;
      return Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        modulesByPkg
          .get(pkg.id)!
          .map((moduleName) => loadBrickModule(pkg.id, moduleName))
      );
    })
  );

  if (v2Adapter && v2Packages.length > 0) {
    if (!v2AdapterPromise) {
      const loadV2Adapter = async () => {
        await loadScript(v2Adapter.filePath, window.PUBLIC_ROOT ?? "");
        await loadBrickModule(v2Adapter.id, "./load-bricks");
        return document.createElement(
          "v2-adapter.load-bricks"
        ) as unknown as V2AdapterBrick;
      };
      v2AdapterPromise = loadV2Adapter();
    }

    pkgPromises.push(
      v2AdapterPromise.then((adapter) =>
        Promise.all(
          v2Packages.map((pkg) =>
            adapter.resolve(
              v2Adapter.filePath,
              pkg.filePath,
              type === "bricks"
                ? modulesByPkg
                    .get(pkg.filePath.split("/").slice(0, 2).join("/"))!
                    .map((moduleName) => moduleName.split("/").pop()!)
                : [],
              (pkg as { dll?: string[] }).dll
            )
          )
        )
      )
    );
  }

  await Promise.all(pkgPromises);
}

function dispatchRequestStatus(promise: Promise<unknown>) {
  window.dispatchEvent(new Event("request.start"));
  promise.finally(() => {
    window.dispatchEvent(new Event("request.end"));
  });
}

function getProcessorPackageName(camelPackageName: string): string {
  return camelPackageName
    .replace(/[A-Z]/g, (match) => `-${match[0].toLocaleLowerCase()}`)
    .replace(/_[0-9]/g, (match) => `-${match[1]}`);
}
