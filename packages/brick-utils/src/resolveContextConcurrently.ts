import { MemberExpression } from "@babel/types";
import { ContextConf } from "@next-core/brick-types";
import { isEvaluable, preevaluate } from "./cook";
import PrecookVisitor from "./cook/PrecookVisitor";
import { isObject } from "./isObject";

export async function resolveContextConcurrently(
  contextConfs: ContextConf[],
  resolveContext: (contextConf: ContextConf) => Promise<boolean>
): Promise<void> {
  const dependencyMap = getDependencyMapOfContext(contextConfs);
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

  async function scheduleNext(): Promise<void> {
    const readyContexts = Array.from(dependencyMap.entries())
      .filter((entry, index) =>
        // When contexts contain computed CTX accesses, it implies a dynamic dependency map.
        // So make them process sequentially, keep the same behavior as before.
        includesComputed
          ? index === 0
          : // A context is ready when it has no pending dependencies.
            !entry[1].dependencies.some((dep) => pendingDeps.has(dep))
      )
      .map((entry) => entry[0])
      .filter((contextConf) => !processed.has(contextConf));
    await Promise.all(readyContexts.map(wrapResolve));
  }

  await scheduleNext();

  // If there are still contexts left, it implies circular CTXs.
  if (dependencyMap.size > 0) {
    throw new ReferenceError(
      `Circular CTX detected: ${Array.from(dependencyMap.keys())
        .map((contextConf) => contextConf.name)
        .join(", ")}`
    );
  }
}

interface ContextStatistics {
  dependencies: string[];
  includesComputed: boolean;
}

export function getDependencyMapOfContext(
  contextConfs: ContextConf[]
): Map<ContextConf, ContextStatistics> {
  const depsMap = new Map<ContextConf, ContextStatistics>();
  for (const contextConf of contextConfs) {
    const stats: ContextStatistics = {
      dependencies: [],
      includesComputed: false,
    };
    if (!contextConf.property) {
      collectContexts(contextConf.resolve || contextConf.value, stats);
    }
    depsMap.set(contextConf, stats);
  }
  return depsMap;
}

const CTX = "CTX";

function collectContexts(
  data: unknown,
  stats: ContextStatistics,
  memo = new WeakSet()
): void {
  if (typeof data === "string") {
    if (data.includes(CTX) && isEvaluable(data)) {
      preevaluate(data, {
        visitors: {
          MemberExpression: (node: MemberExpression, state, callback) => {
            if (node.object.type === "Identifier" && node.object.name === CTX) {
              if (!node.computed && node.property.type === "Identifier") {
                if (!stats.dependencies.includes(node.property.name)) {
                  stats.dependencies.push(node.property.name);
                }
              } else {
                stats.includesComputed = true;
              }
            }
            PrecookVisitor.MemberExpression(node, state, callback);
          },
        },
      });
    }
  } else if (isObject(data)) {
    // Avoid call stack overflow.
    if (memo.has(data)) {
      return;
    }
    memo.add(data);
    if (Array.isArray(data)) {
      for (const item of data) {
        collectContexts(item, stats, memo);
      }
    } else {
      for (const item of Object.values(data)) {
        collectContexts(item, stats, memo);
      }
    }
  }
}
