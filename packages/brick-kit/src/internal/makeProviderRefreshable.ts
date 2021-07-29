import { get } from "lodash";
import {
  GeneralTransform,
  HandleReject,
  HandleRejectByTransform,
} from "@next-core/brick-types";
import {
  transformIntermediateData,
  transformElementProperties,
} from "../transformProperties";
import { computeRealValue } from "./setProperties";
import { RuntimeBrick } from "../core/exports";
import { handleHttpError } from "../handleHttpError";
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

export interface RefreshOptions {
  ignoreErrors?: boolean;
  throwErrors?: boolean;
  $$scheduled?: boolean;
}

export interface RefreshableProvider extends Element {
  interval?: IntervalSettings;

  // 使用 `$` 作前缀表明这是运行时追加的属性/方法。
  $refresh: (options?: RefreshOptions) => Promise<void>;

  // 使用 `$$` 作前缀表明这是运行时追加的内部属性/方法。
  $$dependents: ProviderDependents[];

  $clearInterval?: () => void;

  $$intervalCleared?: boolean;

  [key: string]: any;
}

export function makeProviderRefreshable(
  providerBrick: RefreshableProvider
): void {
  if (!providerBrick.$refresh) {
    // Use a symbol key to make a private property.
    const keyOfIntervalStopped = Symbol("intervalStopped");
    Object.defineProperties(providerBrick, {
      $$dependents: {
        value: [],
      },
      $stopInterval: {
        value: () => {
          (providerBrick as any)[keyOfIntervalStopped] = true;
        },
      },
      // Currently don't support `$restartInterval`.
      // $restartInterval: {
      //   value: () => {
      //     (providerBrick as any)[keyOfIntervalStopped] = false;
      //   }
      // },
      $refresh: {
        value: async function ({
          ignoreErrors,
          throwErrors,
          $$scheduled,
        }: RefreshOptions = {}) {
          if ($$scheduled && (providerBrick as any)[keyOfIntervalStopped]) {
            return;
          }
          const cache = new Map();
          try {
            await Promise.all(
              (this as RefreshableProvider).$$dependents.map(
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
                      const onRejectTransform = (
                        onReject as HandleRejectByTransform
                      ).transform;
                      if (onRejectTransform) {
                        transformElementProperties(
                          brick.element,
                          error,
                          brick.context
                            ? (computeRealValue(
                                onRejectTransform,
                                brick.context,
                                true
                              ) as GeneralTransform)
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
                        ? (computeRealValue(
                            intermediateTransform,
                            brick.context,
                            true
                          ) as GeneralTransform)
                        : intermediateTransform,
                      intermediateTransformFrom,
                      intermediateTransformMapArray
                    );
                  }

                  transformElementProperties(
                    brick.element,
                    data,
                    brick.context
                      ? (computeRealValue(
                          transform,
                          brick.context,
                          true
                        ) as GeneralTransform)
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
        },
      },
    });
  }
}
