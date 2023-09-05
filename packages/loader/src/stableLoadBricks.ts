import loadScript from "./loadScript.js";
import loadSharedModule from "./loadSharedModule.js";

interface BrickPackage {
  id: string;
  filePath: string;
  elements?: string[];
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
  bricks: string[] | Set<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("bricks", bricks, brickPackages);
  return dispatchRequestStatus(promise);
}

export function enqueueStableLoadProcessors(
  processors: string[] | Set<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("processors", processors, brickPackages);
  return dispatchRequestStatus(promise);
}

export async function loadBricksImperatively(
  bricks: string[] | Set<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("bricks", bricks, brickPackages);
  flushStableLoadBricks();
  return dispatchRequestStatus(promise);
}

export function loadProcessorsImperatively(
  processors: string[] | Set<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const promise = enqueueStableLoad("processors", processors, brickPackages);
  flushStableLoadBricks();
  return dispatchRequestStatus(promise);
}

interface V2AdapterBrick {
  resolve(
    adapterPkgFilePath: string,
    brickPkgFilePath: string,
    bricks: string[],
    dlls: string[] | undefined,
    brickPackages: BrickPackage[]
  ): Promise<void>;
}

let v2AdapterPromise: Promise<V2AdapterBrick> | undefined;
const V2_ADAPTER_LOAD_BRICKS = "v2-adapter.load-bricks";

// Get brick/processor items including their dependencies
function getItemsByPkg(
  type: "bricks" | "processors",
  list: string[] | Set<string>,
  brickPackagesMap: Map<string, BrickPackage>
) {
  const itemsByPkg = new Map<BrickPackage, string[]>();
  const listToLoad = new Set<string>();
  const add = (item: string) => {
    if (listToLoad.has(item)) {
      return;
    }
    listToLoad.add(item);
    let pkg: BrickPackage | undefined;
    let namespace: string;
    let itemName: string | undefined;
    if (type === "processors" || item.includes(".")) {
      [namespace, itemName] = item.split(".");
      const pkgId = `bricks/${
        type === "processors" ? getProcessorPackageName(namespace) : namespace
      }`;
      pkg = brickPackagesMap.get(pkgId);
    } else {
      itemName = item;
      for (const p of brickPackagesMap.values()) {
        if (p.elements?.some((e) => e === itemName)) {
          pkg = p;
          break;
        }
      }
    }

    if (!pkg) {
      // eslint-disable-next-line no-console
      console.error(`Package for ${item} not found.`);
      return;
    }

    let groupItems = itemsByPkg.get(pkg);
    if (!groupItems) {
      groupItems = [];
      itemsByPkg.set(pkg, groupItems);
    }
    groupItems.push(itemName!);

    // Load their dependencies too
    const deps = pkg.dependencies?.[item];
    if (deps) {
      for (const dep of deps) {
        add(dep);
      }
    }
  };
  for (const item of list) {
    add(item);
  }
  return itemsByPkg;
}

async function loadBrickModule(
  type: "bricks" | "processors",
  pkgId: string,
  itemName: string
) {
  const moduleName = `${
    type === "processors" ? "./processors/" : "./"
  }${itemName}`;
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
}

function loadRestBricks(
  type: "bricks" | "processors",
  pkgs: BrickPackage[],
  itemsMap: Map<BrickPackage, string[]>
) {
  return pkgs.map(async (pkg) => {
    await loadScript(pkg.filePath, window.PUBLIC_ROOT ?? "");
    await waitBasicPkg;
    return Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      itemsMap
        .get(pkg)!
        .map((itemName) => loadBrickModule(type, pkg.id, itemName))
    );
  });
}

async function enqueueStableLoad(
  type: "bricks" | "processors",
  list: string[] | Set<string>,
  brickPackages: BrickPackage[]
): Promise<void> {
  const brickPackagesMap = new Map<string, BrickPackage>();
  for (const pkg of brickPackages) {
    const pkgId = pkg.id ?? getPkgIdByFilePath(pkg.filePath);
    brickPackagesMap.set(pkgId, pkg);
  }

  const itemsByPkg = getItemsByPkg(type, list, brickPackagesMap);

  let foundBasicPkg: BrickPackage | undefined;
  const v2Packages: BrickPackage[] = [];
  const v3PackagesOtherThanBasic: BrickPackage[] = [];
  let maybeV2Adapter: BrickPackage | undefined;
  for (const pkg of itemsByPkg.keys()) {
    if (pkg.id) {
      if (pkg.id === "bricks/basic") {
        foundBasicPkg = pkg;
      } else {
        v3PackagesOtherThanBasic.push(pkg);
      }
    } else {
      // Brick packages of v2 has no `id`
      v2Packages.push(pkg);
      maybeV2Adapter = brickPackagesMap.get("bricks/v2-adapter");
      if (!maybeV2Adapter) {
        // eslint-disable-next-line no-console
        console.error("Using v2 bricks, but v2-adapter not found");
      }
    }
  }
  const v2Adapter = maybeV2Adapter;

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
        itemsByPkg
          .get(basicPkg)!
          .map((itemName) => loadBrickModule(type, basicPkg.id, itemName))
      )
    );
  }

  const pkgPromises = [basicPkgPromise].concat(
    loadRestBricks(type, v3PackagesOtherThanBasic, itemsByPkg)
  );

  if (v2Adapter && v2Packages.length > 0) {
    if (!v2AdapterPromise) {
      // Load `v2-adapter.load-bricks` and its dependencies
      const v2AdapterItemsByPkg = getItemsByPkg(
        "bricks",
        [V2_ADAPTER_LOAD_BRICKS],
        brickPackagesMap
      );
      const v2AdapterPackages = [...v2AdapterItemsByPkg.keys()];

      const loadV2Adapter = async () => {
        await Promise.all(
          loadRestBricks("bricks", v2AdapterPackages, v2AdapterItemsByPkg)
        );
        return document.createElement(
          V2_ADAPTER_LOAD_BRICKS
        ) as unknown as V2AdapterBrick;
      };
      v2AdapterPromise = loadV2Adapter();
    }

    pkgPromises.push(
      v2AdapterPromise.then((adapter) =>
        Promise.all(
          v2Packages.map((pkg) => {
            const pkgId = getPkgIdByFilePath(pkg.filePath);
            const pkgNamespace = pkgId.split("/")[1];
            return adapter.resolve(
              v2Adapter.filePath,
              pkg.filePath,
              type === "bricks"
                ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  itemsByPkg
                    .get(pkg)!
                    .map((itemName) => `${pkgNamespace}.${itemName}`)
                : [],
              (pkg as { dll?: string[] }).dll,
              // Todo: remove `brickPackages` as an argument
              brickPackages
            );
          })
        )
      )
    );
  }

  await Promise.all(pkgPromises);
}

async function dispatchRequestStatus(promise: Promise<unknown>) {
  window.dispatchEvent(new Event("request.start"));
  try {
    await promise;
  } finally {
    window.dispatchEvent(new Event("request.end"));
  }
}

function getProcessorPackageName(camelPackageName: string): string {
  return camelPackageName
    .replace(/[A-Z]/g, (match) => `-${match[0].toLocaleLowerCase()}`)
    .replace(/_[0-9]/g, (match) => `-${match[1]}`);
}

function getPkgIdByFilePath(filePath: string) {
  return filePath.split("/").slice(0, 2).join("/");
}
