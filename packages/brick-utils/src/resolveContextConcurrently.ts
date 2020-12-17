import { MemberExpression } from "@babel/types";
import { ContextConf } from "@easyops/brick-types";
import { isEvaluable, preevaluate } from "./cook";
import PrecookVisitor from "./cook/PrecookVisitor";
import { isObject } from "./isObject";

export async function resolveContextConcurrently(
  contextConfs: ContextConf[],
  resolveContext: (contextConf: ContextConf) => Promise<void>
): Promise<void> {
  const pendingDeps = getDependencyMapOfContext(contextConfs);
  const includesComputed = Array.from(pendingDeps.values()).some(
    (stats) => stats.includesComputed
  );
  const processed = new Set<string>();

  const wrapResolve = async (contextConf: ContextConf): Promise<void> => {
    processed.add(contextConf.name);
    await resolveContext(contextConf);
    pendingDeps.delete(contextConf.name);
    await scheduleNext();
  };

  async function scheduleNext(): Promise<void> {
    const readyContexts = Array.from(pendingDeps.values())
      .filter((stats, index) =>
        // When contexts contain computed CTX accesses, it implies a dynamic dependency map.
        // So make them process sequentially, keep the same behavior as before.
        includesComputed
          ? index === 0
          : // A context is ready when it has no pending dependencies.
            !stats.dependencies.some((dep) => pendingDeps.has(dep))
      )
      .map((stats) => stats.contextConf)
      .filter((contextConf) => !processed.has(contextConf.name));
    await Promise.all(readyContexts.map(wrapResolve));
  }

  await scheduleNext();

  // If there are still contexts left, it implies circular CTXs.
  if (pendingDeps.size > 0) {
    throw new ReferenceError(
      `Circular CTX detected: ${Array.from(pendingDeps.keys()).join(", ")}`
    );
  }
}

interface ContextStatistics {
  contextConf: ContextConf;
  dependencies: string[];
  includesComputed: boolean;
}

export function getDependencyMapOfContext(
  contextConfs: ContextConf[]
): Map<string, ContextStatistics> {
  const depsMap = new Map<string, ContextStatistics>();
  for (const contextConf of contextConfs) {
    const stats: ContextStatistics = {
      contextConf,
      dependencies: [],
      includesComputed: false,
    };
    if (!contextConf.property) {
      collectContexts(contextConf.resolve || contextConf.value, stats);
    }
    depsMap.set(contextConf.name, stats);
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
