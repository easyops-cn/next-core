import { get } from "lodash";
import {
  transformProperties,
  transformIntermediateData
} from "@easyops/brick-utils";
import { computeRealValue } from "./setProperties";
import { RuntimeBrick } from "./core/exports";
import { handleHttpError } from "./handleHttpError";
import { GeneralTransform } from "@easyops/brick-types";

export interface ProviderDependents {
  brick: RuntimeBrick;
  method: string;
  args: any[];
  field?: string | string[];
  transform?: GeneralTransform;
  transformFrom?: string | string[];
  ref?: string;
  intermediateTransform?: GeneralTransform;
  intermediateTransformFrom?: string | string[];
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
    providerBrick.$refresh = async function({
      ignoreErrors,
      throwErrors
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
              ref,
              intermediateTransform,
              intermediateTransformFrom
            }) => {
              const cacheKey = JSON.stringify({
                method,
                args
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
              const value = await promise;
              let data =
                field === null || field === undefined
                  ? value
                  : get(value, field);

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
                  intermediateTransformFrom
                );
              }

              transformProperties(
                brick.element,
                data,
                brick.context
                  ? computeRealValue(transform, brick.context, true)
                  : transform,
                transformFrom
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
