import { get } from "lodash";
import { ResolveConf } from "@easyops/brick-types";
import { computeRealValue, setProperties } from "@easyops/brick-utils";
import { RuntimeBrick, MountableElement } from "./exports";
import { handleHttpError } from "../handleHttpError";

interface ProviderDependents {
  brick: RuntimeBrick;
  name: string;
  method: string;
  actualArgs: any;
  field: string | string[];
}

interface IntervalSettings {
  delay: number;
  ignoreErrors?: boolean;
  timeoutId?: any;
}

interface RefreshableProvider {
  interval?: IntervalSettings;

  // 使用 `$` 作前缀表明这是运行时追加的属性/方法。
  $refresh: (options?: {
    ignoreErrors?: boolean;
    throwErrors?: boolean;
  }) => Promise<void>;
  // 使用 `$$` 作前缀表明这是运行时追加的内部属性/方法。
  $$dependents: ProviderDependents[];

  [key: string]: any;
}

export function makeProviderRefreshable(
  providerBrick: RefreshableProvider
): void {
  if (!providerBrick.$refresh) {
    providerBrick.$$dependents = [];
    providerBrick.$refresh = async function({
      ignoreErrors,
      throwErrors
    } = {}) {
      const cache = new Map();
      try {
        await Promise.all(
          this.$$dependents.map(
            async ({ brick, name, method, actualArgs, field }) => {
              const cacheKey = JSON.stringify({
                method,
                actualArgs
              });
              let promise: Promise<any>;
              if (cache.has(cacheKey)) {
                promise = cache.get(cacheKey);
              } else {
                promise = providerBrick[method](...actualArgs);
                cache.set(cacheKey, promise);
              }
              const value = await promise;
              setProperties(
                brick.element,
                {
                  [name]:
                    field === null || field === undefined
                      ? value
                      : get(value, field)
                },
                brick.context
              );
            }
          )
        );
      } catch (error) {
        if (!ignoreErrors) {
          // 默认提示错误，但不抛出错误。
          handleHttpError(error);
          if (throwErrors) {
            throw error;
          }
        }
      }
    };
  }
}

export class Resolver {
  private cache: Map<string, Promise<any>> = new Map();
  private refreshQueue: Map<RefreshableProvider, IntervalSettings> = new Map();

  resetCache(): void {
    if (this.cache.size > 0) {
      this.cache = new Map();
    }
  }

  resetRefreshQueue(): void {
    if (this.refreshQueue.size > 0) {
      for (const interval of this.refreshQueue.values()) {
        clearTimeout(interval.timeoutId);
      }
      this.refreshQueue = new Map();
    }
  }

  async resolve(all: RuntimeBrick[], bg: MountableElement): Promise<void> {
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
        const providerBrick: RefreshableProvider = bg.querySelector(
          provider
        ) as any;
        if (providerBrick) {
          makeProviderRefreshable(providerBrick);

          if (providerBrick.interval && !this.refreshQueue.has(providerBrick)) {
            this.refreshQueue.set(providerBrick, { ...providerBrick.interval });
          }

          const actualArgs = args
            ? computeRealValue(args, brick.context, true)
            : providerBrick.args || [];

          providerBrick.$$dependents.push({
            brick,
            name,
            method,
            actualArgs,
            field
          });

          const cacheKey = JSON.stringify({
            provider,
            method,
            args
          });
          let promise: Promise<any>;
          if (this.cache.has(cacheKey)) {
            promise = this.cache.get(cacheKey);
          } else {
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

  scheduleRefreshing(): void {
    for (const [providerBrick, interval] of this.refreshQueue.entries()) {
      const request = async (): Promise<void> => {
        await providerBrick.$refresh({
          ignoreErrors: interval.ignoreErrors,
          throwErrors: true
        });
        // eslint-disable-next-line require-atomic-updates
        interval.timeoutId = setTimeout(request, interval.delay);
      };
      interval.timeoutId = setTimeout(request, interval.delay);
    }
  }
}
