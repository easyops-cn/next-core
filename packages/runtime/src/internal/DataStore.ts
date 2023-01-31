import type {
  BrickEventHandlerCallback,
  ContextConf,
  ResolveOptions,
} from "@next-core/brick-types";
import { hasOwnProperty, isObject } from "@next-core/utils/general";
import { collectMemberUsage } from "@next-core/utils/storyboard";
import { computeRealValue } from "./compute/computeRealValue.js";
import { resolveDataStore } from "./resolveDataStore.js";
import { RuntimeContext } from "./RuntimeContext.js";
import { RuntimeBrick } from "./Transpiler.js";

export type DataStoreType = "CTX" | "STATE" | "FORM_STATE";

export interface DataStoreItem {
  value: unknown;
  eventTarget?: EventTarget;
  loaded?: boolean;
  loading?: Promise<unknown>;
  load?: (options?: ResolveOptions) => Promise<unknown>;
}

export class DataStore<T extends DataStoreType = "CTX"> {
  readonly type: T;
  private readonly data = new Map<string, DataStoreItem>();
  private readonly changeEventType: string;
  readonly pendingStack: Array<ReturnType<typeof resolveDataStore>> = [];

  constructor(type: T) {
    this.type = type;
    this.changeEventType =
      this.type === "FORM_STATE"
        ? "formstate.change"
        : this.type === "STATE"
        ? "state.change"
        : "context.change";
  }

  private setValue(name: string, item: DataStoreItem): void {
    if (this.data.has(name)) {
      // eslint-disable-next-line no-console
      console.warn(
        `${this.type} "${name}" have already existed, it will be replaced.`
      );
    }
    this.data.set(name, item);
  }

  /** Get value of free-variable only. */
  getValue(name: string): unknown {
    return this.data.get(name)?.value;
  }

  get(): Map<string, DataStoreItem> {
    return this.data;
  }

  updateValue(
    name: string,
    value: unknown,
    method: "assign" | "replace" | "refresh" | "load",
    callback?: BrickEventHandlerCallback
  ): void {
    const item = this.data.get(name);
    if (!item) {
      throw new Error(`${this.type} not defined: ${name}`);
    }

    if (method === "refresh" || method === "load") {
      if (!item.load) {
        throw new Error(
          `You can not ${method} the "${this.type}.${name}" which has no resolve.`
        );
      }

      let promise: Promise<unknown> | undefined;
      if (method === "load") {
        // Try to reuse previous request when calling `load`.
        if (item.loaded) {
          promise = Promise.resolve(item.value);
        } else if (item.loading) {
          promise = item.loading;
        }
      }

      if (!promise) {
        promise = item.loading = item.load({
          cache: method === "load" ? "default" : "reload",
          ...(value as ResolveOptions),
        });
        // Do not use the chained promise, since the callbacks need the original promise.
        promise.then(
          (val) => {
            item.loaded = true;
            item.value = val;
            item.eventTarget?.dispatchEvent(
              new CustomEvent(this.changeEventType, {
                detail: item.value,
              })
            );
          },
          (err) => {
            // Let users to override error handling.
            if (!callback?.error) {
              // handleHttpError(err);
            }
          }
        );
      }

      // if (callback) {
      //   const callbackFactory = eventCallbackFactory(
      //     callback,
      //     () =>
      //       this.getResolveOptions(_internalApiGetCurrentContext())
      //         .mergedContext,
      //     null
      //   );

      //   promise.then(
      //     (val) => {
      //       callbackFactory("success")({ value: val });
      //       callbackFactory("finally")();
      //     },
      //     (err) => {
      //       callbackFactory("error")(err);
      //       callbackFactory("finally")();
      //     }
      //   );
      // }

      return;
    }

    if (method === "replace") {
      item.value = value;
    } else {
      if (isObject(item.value)) {
        Object.assign(item.value, value);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `Non-object current value of context "${name}" for "context.assign", try "context.replace" instead.`
        );
        item.value = value;
      }
    }

    item.eventTarget?.dispatchEvent(
      new CustomEvent(this.changeEventType, {
        detail: item.value,
      })
    );
  }

  define(
    dataConfs: ContextConf[],
    runtimeContext: RuntimeContext,
    brick?: RuntimeBrick
  ): void {
    if (Array.isArray(dataConfs) && dataConfs.length > 0) {
      const pending = resolveDataStore(
        dataConfs,
        (dataConf: ContextConf) =>
          this.resolve(dataConf, runtimeContext, brick),
        this.type
      );
      this.pendingStack.push(pending);
    }
  }

  async waitForUsedData(value: unknown): Promise<void> {
    const usage = collectMemberUsage(value, this.type);
    if (usage.hasNonStaticUsage) {
      for (const pending of this.pendingStack) {
        await pending.pendingResult;
      }
    } else if (usage.usedProperties.size > 0) {
      for (const { pendingContexts } of this.pendingStack) {
        await Promise.all(
          [...usage.usedProperties].map((ctx) => pendingContexts.get(ctx))
        );
      }
    }
  }

  private async resolve(
    dataConf: ContextConf,
    runtimeContext: RuntimeContext,
    brick?: RuntimeBrick
  ): Promise<boolean> {
    // await this.waitForUsedData(dataConf.if);
    // if (!await looseCheckIf(dataConf, runtimeContext)) {
    //   return false;
    // }
    let value: unknown;
    if (
      this.type === "STATE" &&
      brick!.properties &&
      hasOwnProperty(brick!.properties, dataConf.name)
    ) {
      value = brick!.properties[dataConf.name];
    }
    let load: DataStoreItem["load"];
    let isLazyResolve: boolean | undefined = false;
    if (value === undefined) {
      if (dataConf.resolve) {
        // await this.waitForUsedData(dataConf.resolve.if);
        // if (await looseCheckIf(dataConf.resolve, runtimeContext)) {
        load = async (options) => {
          const valueConf: Record<string, unknown> = {};
          // await _internalApiGetResolver().resolveOne(
          //   "reference",
          //   {
          //     transform: "value",
          //     transformMapArray: false,
          //     ...dataConf.resolve,
          //   },
          //   valueConf,
          //   null,
          //   runtimeContext,
          //   options
          // );
          // return valueConf.value;
        };
        isLazyResolve = dataConf.resolve.lazy;
        if (!isLazyResolve) {
          value = await load();
        }
        // } else if (!hasOwnProperty(dataConf, "value")) {
        //   return false;
        // }
      }
      if ((!load || isLazyResolve) && dataConf.value !== undefined) {
        // await this.waitForUsedData(dataConf.value);
        // If the context has no resolve, just use its `value`.
        // Or if the resolve is ignored or lazy, use its `value` as a fallback.
        value = await computeRealValue(dataConf.value, runtimeContext);
      }
    }

    // resolveFreeVariableValue(
    //   value,
    //   dataConf,
    //   mergedContext,
    //   storyboardContextWrapper,
    //   brick,
    //   load,
    //   !isLazyResolve
    // );
    return true;
  }
}
