import { ContextConf } from "@next-core/types";
import { collectMemberUsage, MemberUsage } from "@next-core/utils/storyboard";

export interface DeferredContext {
  resolve(): void;
  reject(e: unknown): void;
}

export function resolveDataStore(
  contextConfs: ContextConf[],
  resolveContext: (contextConf: ContextConf) => Promise<boolean>,
  keyword = "CTX"
): {
  pendingResult: Promise<void>;
  pendingContexts: Map<string, Promise<void>>;
} {
  const dependencyMap = getDependencyMapOfContext(contextConfs, keyword);
  // There maybe multiple context confs for a specific name, since there are conditional contexts.
  // This is a map of how many pending context confs for each context name.
  const pendingDeps = new Map<string, number>();
  for (const contextName of Array.from(dependencyMap.keys()).map(
    (contextConf) => contextConf.name
  )) {
    pendingDeps.set(contextName, (pendingDeps.get(contextName) ?? 0) + 1);
  }
  const hasNonStaticUsage = Array.from(dependencyMap.values()).some(
    (stats) => stats.hasNonStaticUsage
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
    const left = pendingDeps.get(contextConf.name) ?? 0;
    if (resolved) {
      // Assert: contextConf.name exists in deferredContexts
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      deferredContexts.get(contextConf.name)!.resolve();
      pendingDeps.delete(contextConf.name);
      if (left === 0) {
        throw new Error(`Duplicated context defined: ${contextConf.name}`);
      }
    } else {
      // Assert: left >= 1
      if (left === 1) {
        // Assert: contextConf.name exists in deferredContexts
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        deferredContexts.get(contextConf.name)!.resolve();
        pendingDeps.delete(contextConf.name);
      } else {
        pendingDeps.set(contextConf.name, left - 1);
      }
    }
    await scheduleNext();
  };

  let scheduleAsSerial = hasNonStaticUsage;

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

function predicateNextResolveFactory(
  pendingDeps: Map<string, number>,
  scheduleAsSerial: boolean
): (entry: [ContextConf, MemberUsage], index: number) => boolean {
  return (entry, index) =>
    // When contexts contain computed CTX accesses, it implies a dynamic dependency map.
    // So make them process sequentially, keep the same behavior as before.
    scheduleAsSerial
      ? index === 0
      : // A context is ready when it has no pending dependencies.
        ![...entry[1].usedProperties].some((dep) => pendingDeps.has(dep));
}

export function getDependencyMapOfContext(
  contextConfs: ContextConf[],
  keyword = "CTX"
): Map<ContextConf, MemberUsage> {
  const depsMap = new Map<ContextConf, MemberUsage>();
  for (const contextConf of contextConfs) {
    const stats = collectMemberUsage(
      [contextConf.if, contextConf.value, contextConf.resolve],
      keyword
    );
    depsMap.set(contextConf, stats);
  }
  return depsMap;
}

function detectCircularContexts(
  dependencyMap: Map<ContextConf, MemberUsage>,
  keyword: string
): void {
  const duplicatedMap = new Map(dependencyMap);
  const pendingDeps = new Set<string>(
    Array.from(duplicatedMap.keys()).map((contextConf) => contextConf.name)
  );
  const next = (): void => {
    let processedAtLeastOne = false;
    for (const [contextConf, stats] of duplicatedMap.entries()) {
      if (![...stats.usedProperties].some((dep) => pendingDeps.has(dep))) {
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
