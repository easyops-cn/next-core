import { ContextConf } from "@next-core/brick-types";
import { collectContextUsage, ContextUsage } from "./track";

export interface DeferredContext {
  resolve(): void;
  reject(e: unknown): void;
}

export function deferResolveContextConcurrently(
  contextConfs: ContextConf[],
  resolveContext: (contextConf: ContextConf) => Promise<boolean>,
  keyword = "CTX"
): {
  pendingResult: Promise<void>;
  pendingContexts: Map<string, Promise<void>>;
} {
  const dependencyMap = getDependencyMapOfContext(contextConfs, keyword);
  const pendingDeps = new Set<string>(
    Array.from(dependencyMap.keys()).map((contextConf) => contextConf.name)
  );
  const includesComputed = Array.from(dependencyMap.values()).some(
    (stats) => stats.includesComputed
  );
  const processed = new WeakSet<ContextConf>();

  const deferredContexts = new Map<string, DeferredContext>();
  const pendingContexts = new Map(
    [...new Set(contextConfs.map((contextConf) => contextConf.name))].map(
      (contextName) => [
        contextName,
        new Promise<void>((resolve, reject) => {
          deferredContexts.set(contextName, { resolve, reject });
        }),
      ]
    )
  );

  const wrapResolve = async (contextConf: ContextConf): Promise<void> => {
    processed.add(contextConf);
    const resolved = await resolveContext(contextConf);
    dependencyMap.delete(contextConf);
    if (resolved) {
      deferredContexts.get(contextConf.name).resolve();
      if (!pendingDeps.delete(contextConf.name)) {
        throw new Error(`Duplicated context defined: ${contextConf.name}`);
      }
    }
    await scheduleNext();
  };

  let scheduleAsSerial = includesComputed;

  async function scheduleNext(): Promise<void> {
    const readyContexts = Array.from(dependencyMap.entries())
      .filter(predicateNextResolveFactory(pendingDeps, scheduleAsSerial))
      .map((entry) => entry[0])
      .filter((contextConf) => !processed.has(contextConf));
    await Promise.all(readyContexts.map(wrapResolve));
  }

  const pendingResult = scheduleNext()
    .then(async () => {
      // If there are still contexts left, it implies one of these situations:
      //   - Circular contexts.
      //     Such as: a depends on b, while b depends on a.
      //   - Related contexts are all ignored.
      //     Such as: a depends on b,
      //     while both them are ignore by a falsy result of `if`.
      if (dependencyMap.size > 0) {
        // This will throw if circular contexts detected.
        detectCircularContexts(dependencyMap, keyword);
        scheduleAsSerial = true;
        await scheduleNext();
      }
      // There maybe ignored contexts which are still not fulfilled.
      // We treat them as RESOLVED.
      for (const deferred of deferredContexts.values()) {
        deferred.resolve();
      }
    })
    .catch((error) => {
      // There maybe contexts left not fulfilled, when an error occurred.
      // We treat them as REJECTED.
      for (const deferred of deferredContexts.values()) {
        deferred.reject(error);
      }
      throw error;
    });
  return { pendingResult, pendingContexts };
}

export async function resolveContextConcurrently(
  contextConfs: ContextConf[],
  resolveContext: (contextConf: ContextConf) => Promise<boolean>,
  keyword = "CTX"
): Promise<void> {
  const dependencyMap = getDependencyMapOfContext(contextConfs, keyword);
  const pendingDeps = new Set<string>(
    Array.from(dependencyMap.keys()).map((contextConf) => contextConf.name)
  );
  const includesComputed = Array.from(dependencyMap.values()).some(
    (stats) => stats.includesComputed
  );
  const processed = new WeakSet<ContextConf>();

  const wrapResolve = async (contextConf: ContextConf): Promise<void> => {
    processed.add(contextConf);
    const resolved = await resolveContext(contextConf);
    dependencyMap.delete(contextConf);
    if (resolved) {
      if (!pendingDeps.delete(contextConf.name)) {
        throw new Error(`Duplicated context defined: ${contextConf.name}`);
      }
    }
    await scheduleNext();
  };

  let scheduleAsSerial = includesComputed;

  async function scheduleNext(): Promise<void> {
    const readyContexts = Array.from(dependencyMap.entries())
      .filter(predicateNextResolveFactory(pendingDeps, scheduleAsSerial))
      .map((entry) => entry[0])
      .filter((contextConf) => !processed.has(contextConf));
    await Promise.all(readyContexts.map(wrapResolve));
  }

  await scheduleNext();

  // If there are still contexts left, it implies one of these situations:
  //   - Circular contexts.
  //     Such as: a depends on b, while b depends on a.
  //   - Related contexts are all ignored.
  //     Such as: a depends on b,
  //     while both them are ignore by a falsy result of `if`.
  if (dependencyMap.size > 0) {
    // This will throw if circular contexts detected.
    detectCircularContexts(dependencyMap, keyword);
    scheduleAsSerial = true;
    await scheduleNext();
  }
}

export function syncResolveContextConcurrently(
  contextConfs: ContextConf[],
  resolveContext: (contextConf: ContextConf) => boolean,
  keyword = "CTX"
): void {
  const dependencyMap = getDependencyMapOfContext(contextConfs, keyword);
  const pendingDeps = new Set<string>(
    Array.from(dependencyMap.keys()).map((contextConf) => contextConf.name)
  );
  const includesComputed = Array.from(dependencyMap.values()).some(
    (stats) => stats.includesComputed
  );

  let scheduleAsSerial = includesComputed;

  function scheduleNext(): void {
    const dep = Array.from(dependencyMap.entries()).find(
      predicateNextResolveFactory(pendingDeps, scheduleAsSerial)
    );
    if (dep) {
      const [contextConf] = dep;
      const resolved = resolveContext(contextConf);
      dependencyMap.delete(contextConf);
      if (resolved) {
        if (!pendingDeps.delete(contextConf.name)) {
          throw new Error(`Duplicated context defined: ${contextConf.name}`);
        }
      }
      scheduleNext();
    }
  }

  scheduleNext();

  // If there are still contexts left, it implies one of these situations:
  //   - Circular contexts.
  //     Such as: a depends on b, while b depends on a.
  //   - Related contexts are all ignored.
  //     Such as: a depends on b,
  //     while both them are ignore by a falsy result of `if`.
  if (dependencyMap.size > 0) {
    // This will throw if circular contexts detected.
    detectCircularContexts(dependencyMap, keyword);
    scheduleAsSerial = true;
    scheduleNext();
  }
}

function predicateNextResolveFactory(
  pendingDeps: Set<string>,
  scheduleAsSerial: boolean
): (entry: [ContextConf, ContextUsage], index: number) => boolean {
  return (entry, index) =>
    // When contexts contain computed CTX accesses, it implies a dynamic dependency map.
    // So make them process sequentially, keep the same behavior as before.
    scheduleAsSerial
      ? index === 0
      : // A context is ready when it has no pending dependencies.
        !entry[1].usedContexts.some((dep) => pendingDeps.has(dep));
}

export function getDependencyMapOfContext(
  contextConfs: ContextConf[],
  keyword = "CTX"
): Map<ContextConf, ContextUsage> {
  const depsMap = new Map<ContextConf, ContextUsage>();
  for (const contextConf of contextConfs) {
    const stats = collectContextUsage(
      contextConf.property
        ? null
        : [contextConf.if, contextConf.value, contextConf.resolve],
      keyword
    );
    depsMap.set(contextConf, stats);
  }
  return depsMap;
}

function detectCircularContexts(
  dependencyMap: Map<ContextConf, ContextUsage>,
  keyword: string
): void {
  const duplicatedMap = new Map(dependencyMap);
  const pendingDeps = new Set<string>(
    Array.from(duplicatedMap.keys()).map((contextConf) => contextConf.name)
  );
  const next = (): void => {
    let processedAtLeastOne = false;
    for (const [contextConf, stats] of duplicatedMap.entries()) {
      if (!stats.usedContexts.some((dep) => pendingDeps.has(dep))) {
        duplicatedMap.delete(contextConf);
        pendingDeps.delete(contextConf.name);
        processedAtLeastOne = true;
      }
    }
    if (processedAtLeastOne) {
      next();
    }
  };
  next();

  if (duplicatedMap.size > 0) {
    throw new ReferenceError(
      `Circular ${keyword} detected: ${Array.from(duplicatedMap.keys())
        .map((contextConf) => contextConf.name)
        .join(", ")}`
    );
  }
}
