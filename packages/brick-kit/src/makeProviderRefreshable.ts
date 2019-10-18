import { get } from "lodash";
import { setProperties } from "@easyops/brick-utils";
import { RuntimeBrick } from "./core/exports";
import { handleHttpError } from "./handleHttpError";

export interface ProviderDependents {
  brick: RuntimeBrick;
  name: string;
  method: string;
  actualArgs: any;
  field: string | string[];
}

export interface IntervalSettings {
  delay: number;
  ignoreErrors?: boolean;
  timeoutId?: any;
}

export interface RefreshableProvider {
  interval?: IntervalSettings;

  // 使用 `$` 作前缀表明这是运行时追加的属性/方法。
  $refresh: (options?: {
    ignoreErrors?: boolean;
    throwErrors?: boolean;
  }) => Promise<void>;
  // 使用 `$$` 作前缀表明这是运行时追加的内部属性/方法。
  $$dependents: ProviderDependents[];
  $$cache: Map<string, Promise<any>>;

  [key: string]: any;
}

export function makeProviderRefreshable(
  providerBrick: RefreshableProvider
): void {
  if (!providerBrick.$$cache) {
    providerBrick.$$cache = new Map();
  }
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
