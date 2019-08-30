import { get } from "lodash";
import { ResolveConf } from "@easyops/brick-types";
import { computeRealValue } from "@easyops/brick-utils";
import { RuntimeBrick, MountableElement } from "./exports";

export class Resolver {
  private cache: Map<string, Promise<any>>;

  resetCache(): void {
    this.cache = new Map();
  }

  async resolve(all: RuntimeBrick[], bg: MountableElement): Promise<any> {
    const useResolvesBricks = all.filter(
      brick => brick.lifeCycle && brick.lifeCycle.useResolves && !brick.bg
    );
    if (useResolvesBricks.length === 0) {
      return;
    }
    const resolves = useResolvesBricks.reduce<[RuntimeBrick, ResolveConf][]>(
      (acc, brick) =>
        acc.concat(
          brick.lifeCycle.useResolves.map(resolveConf => [brick, resolveConf])
        ),
      []
    );

    await Promise.all(
      resolves.map(async ([brick, resolveConf]) => {
        const { type, properties } = brick;
        const { name, provider, method = "resolve", args, field } = resolveConf;
        const providerBrick = bg.querySelector(provider) as any;
        if (providerBrick) {
          const cacheKey = JSON.stringify({
            provider,
            method,
            args
          });
          let promise;
          if (this.cache.has(cacheKey)) {
            promise = this.cache.get(cacheKey);
          } else {
            const actualArgs = args
              ? computeRealValue(args, brick.context, true)
              : providerBrick.args || [];
            promise = providerBrick[method](...actualArgs);
            this.cache.set(cacheKey, promise);
          }
          const value = await promise;
          properties[name] =
            field === null || field === undefined ? value : get(value, field);
        } else {
          throw new Error(`Provider not found: "${provider}" in brick ${type}`);
        }
      })
    );
  }
}
