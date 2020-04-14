import { get } from "lodash";
import {
  GeneralTransform,
  HandleReject,
  HandleRejectByTransform,
} from "@easyops/brick-types";
import {
  transformProperties,
  transformIntermediateData,
} from "./transformProperties";
import { computeRealValue } from "./setProperties";
import { RuntimeBrick } from "./core/exports";
import { handleHttpError } from "./handleHttpError";
import { recursiveMarkAsInjected } from "./injected";

export interface ProviderDependents {
  brick: RuntimeBrick;
  method: string;
  args: any[];
  field?: string | string[];
  transform?: GeneralTransform;
  transformFrom?: string | string[];
  transformMapArray?: boolean | "auto";
  onReject?: HandleReject;
  ref?: string;
  intermediateTransform?: GeneralTransform;
  intermediateTransformFrom?: string | string[];
  intermediateTransformMapArray?: boolean | "auto";
}

export interface IntervalSettings {
  delay: number;
  ignoreErrors?: boolean;
  timeoutId?: any;
}

export interface RefreshableProvider extends Element {
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
    providerBrick.$refresh = async function ({
      ignoreErrors,
      throwErrors,
    } = {}) {
      const cache = new Map();
      try {
        await Promise.all(
          this.$$dependents.map(
            async ({
              brick,
              method,
              args,
              field,
              transform,
              transformFrom,
              transformMapArray,
              onReject,
              ref,
              intermediateTransform,
              intermediateTransformFrom,
              intermediateTransformMapArray,
            }) => {
              const cacheKey = JSON.stringify({
                method,
                args,
              });
              let promise: Promise<any>;
              if (cache.has(cacheKey)) {
                promise = cache.get(cacheKey);
              } else {
                const actualArgs = args
                  ? brick.context
                    ? computeRealValue(args, brick.context, true)
                    : args
                  : providerBrick.args || [];
                promise = providerBrick[method](...actualArgs);
                cache.set(cacheKey, promise);
              }
              let data: any;

              async function fetchData(): Promise<void> {
                const value = await promise;
                data =
                  field === null || field === undefined
                    ? value
                    : get(value, field);
                // The fetched data and its inner objects should never be *injected* again.
                recursiveMarkAsInjected(data);
              }

              if (onReject) {
                // Transform as `onReject.transform` when provider failed.
                try {
                  await fetchData();
                } catch (error) {
                  const onRejectTransform = (onReject as HandleRejectByTransform)
                    .transform;
                  if (onRejectTransform) {
                    transformProperties(
                      brick.element,
                      error,
                      brick.context
                        ? computeRealValue(
                            onRejectTransform,
                            brick.context,
                            true
                          )
                        : onRejectTransform
                    );
                  }
                  return;
                }
              } else {
                await fetchData();
              }

              if (ref) {
                data = transformIntermediateData(
                  data,
                  brick.context
                    ? computeRealValue(
                        intermediateTransform,
                        brick.context,
                        true
                      )
                    : intermediateTransform,
                  intermediateTransformFrom,
                  intermediateTransformMapArray
                );
              }

              transformProperties(
                brick.element,
                data,
                brick.context
                  ? computeRealValue(transform, brick.context, true)
                  : transform,
                transformFrom,
                transformMapArray
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
