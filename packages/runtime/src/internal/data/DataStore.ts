import type {
  BatchUpdateContextItem,
  BrickEventHandlerCallback,
  ContextConf,
  ContextResolveTriggerBrickLifeCycle,
} from "@next-core/types";
import { hasOwnProperty, isObject } from "@next-core/utils/general";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";
import { eventCallbackFactory, listenerFactory } from "../bindListeners.js";
import { asyncCheckIf } from "../compute/checkIf.js";
import {
  asyncComputeRealValue,
  computeRealValue,
} from "../compute/computeRealValue.js";
import { ResolveOptions, resolveData } from "./resolveData.js";
import { resolveDataStore } from "./resolveDataStore.js";
import type {
  AsyncProperties,
  RuntimeBrick,
  RuntimeContext,
} from "../interfaces.js";
import { handleHttpError } from "../../handleHttpError.js";

export type DataStoreType = "CTX" | "STATE" | "FORM_STATE";

export interface DataStoreItem {
  value: unknown;
  eventTarget: EventTarget;
  loaded?: boolean;
  loading?: Promise<unknown>;
  load?: (options?: ResolveOptions) => Promise<unknown>;
  deps: string[];
}

export class DataStore<T extends DataStoreType = "CTX"> {
  private readonly type: T;
  private readonly data = new Map<string, DataStoreItem>();
  private readonly changeEventType: string;
  private readonly pendingStack: Array<ReturnType<typeof resolveDataStore>> =
    [];
  public readonly hostBrick?: RuntimeBrick;
  public batchUpdate = false;
  public batchUpdateContextsNames: string[] = [];
  readonly batchTriggerContextsNamesMap: Map<
    ContextResolveTriggerBrickLifeCycle,
    string[]
  > = new Map();

  constructor(type: T, hostBrick?: RuntimeBrick) {
    this.type = type;
    this.changeEventType =
      this.type === "FORM_STATE"
        ? "formstate.change"
        : this.type === "STATE"
        ? "state.change"
        : "context.change";
    this.hostBrick = hostBrick;
  }

  getValue(name: string): unknown {
    return this.data.get(name)?.value;
  }

  getAffectListByContext(name: string): string[] {
    const affectNames = [name];
    this.data.forEach((value, key) => {
      if (value.deps) {
        const isInDeps = value.deps.some((item) => affectNames.includes(item));
        isInDeps &&
          affectNames.push(key) &&
          affectNames.push(...this.getAffectListByContext(key));
      }
    });
    affectNames.shift();
    return [...new Set(affectNames)];
  }

  updateValues(
    values: BatchUpdateContextItem[],
    method: "assign" | "replace",
    argsFactory: (arg: unknown[]) => BatchUpdateContextItem
  ): void {
    this.batchUpdate = true;
    this.batchUpdateContextsNames = values.map((item) => item.name);
    if (
      [...new Set(this.batchUpdateContextsNames)].length !==
      this.batchUpdateContextsNames.length
    ) {
      throw new Error(`Batch update not allow to update same item`);
    }

    const updateContexts: Record<string, DataStoreItem> = {};
    const affectContexts: Record<string, DataStoreItem> = {};
    const affectDepsContextNames: string[] = [];

    values.forEach((arg) => {
      const { name, value } = argsFactory([arg]);
      const updateContextItem = this.data.get(name);
      affectDepsContextNames.push(...this.getAffectListByContext(name));
      updateContextItem && (updateContexts[name] = updateContextItem);
      this.updateValue(name as string, value, method);
    });

    affectDepsContextNames
      .filter((item) => !updateContexts[item])
      .forEach((name) => {
        const affectContextItem = this.data.get(name);
        affectContextItem && (affectContexts[name] = affectContextItem);
      });

    const triggerEvent = (contexts: Record<string, DataStoreItem>): void => {
      for (const key in contexts) {
        const context = contexts[key];
        context.eventTarget?.dispatchEvent(
          new CustomEvent(this.changeEventType, {
            detail: context.value,
          })
        );
      }
    };

    triggerEvent(updateContexts);
    triggerEvent(affectContexts);

    this.batchUpdate = false;

    return;
  }

  updateValue(
    name: string,
    value: unknown,
    method: "assign" | "replace" | "refresh" | "load",
    callback?: BrickEventHandlerCallback,
    callbackRuntimeContext?: RuntimeContext
  ): void {
    const item = this.data.get(name);
    if (!item) {
      throw new Error(`${this.type} '${name}' is not defined`);
    }

    if (method === "refresh" || method === "load") {
      if (!item.load) {
        throw new Error(
          `You can not ${method} "${this.type}.${name}" which has no resolve`
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
            item.eventTarget.dispatchEvent(
              new CustomEvent(this.changeEventType, {
                detail: item.value,
              })
            );
          },
          (err) => {
            // Let users override error handling.
            if (!callback?.error) {
              handleHttpError(err);
            }
          }
        );
      }

      if (callback) {
        const callbackFactory = eventCallbackFactory(
          callback,
          callbackRuntimeContext!
        );

        promise.then(
          (val) => {
            callbackFactory("success")({ value: val });
            callbackFactory("finally")();
          },
          (err) => {
            callbackFactory("error")(err);
            callbackFactory("finally")();
          }
        );
      }

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
          `Non-object current value of "${this.type}.${name}" for "context.assign", try "context.replace" instead.`
        );
        item.value = value;
      }
    }

    if (this.batchUpdate) return;

    item.eventTarget.dispatchEvent(
      new CustomEvent(this.changeEventType, {
        detail: item.value,
      })
    );
  }

  define(
    dataConfs: ContextConf[] | undefined,
    runtimeContext: RuntimeContext,
    asyncHostProperties?: AsyncProperties
  ): void {
    if (Array.isArray(dataConfs) && dataConfs.length > 0) {
      const pending = resolveDataStore(
        dataConfs,
        (dataConf: ContextConf) =>
          this.resolve(dataConf, runtimeContext, asyncHostProperties),
        this.type
      );
      this.pendingStack.push(pending);
    }
  }

  onChange(dataName: string, listener: EventListener): void {
    this.data
      .get(dataName)
      ?.eventTarget.addEventListener(this.changeEventType, listener);
  }

  async waitFor(dataNames: string[] | Set<string>): Promise<void> {
    for (const { pendingContexts } of this.pendingStack) {
      await Promise.all(
        [...dataNames].map((ctx) => {
          const p = pendingContexts.get(ctx);
          return p;
        })
      );
    }
  }

  async waitForAll(): Promise<void> {
    for (const { pendingResult } of this.pendingStack) {
      await pendingResult;
    }
  }

  private async resolve(
    dataConf: ContextConf,
    runtimeContext: RuntimeContext,
    asyncHostProperties?: AsyncProperties
  ): Promise<boolean> {
    if (!(await asyncCheckIf(dataConf, runtimeContext))) {
      return false;
    }
    let value: unknown;
    if (
      asyncHostProperties &&
      (this.type === "STATE" ? dataConf.expose : this.type === "FORM_STATE")
    ) {
      const hostProps = await asyncHostProperties;
      if (hasOwnProperty(hostProps, dataConf.name)) {
        value = hostProps[dataConf.name];
      }
    }
    let load: DataStoreItem["load"];
    let isLazyResolve: boolean | undefined = false;
    if (value === undefined) {
      if (dataConf.resolve) {
        const resolveConf = {
          transform: "value",
          ...dataConf.resolve,
        };
        if (await asyncCheckIf(dataConf.resolve, runtimeContext)) {
          load = async (options) =>
            (
              (await resolveData(resolveConf, runtimeContext, options)) as {
                value: unknown;
              }
            ).value;
          isLazyResolve = dataConf.resolve.lazy;
          if (!isLazyResolve) {
            value = await load();
          } else if (isLazyResolve && dataConf.resolve.trigger) {
            const lifecycleName = dataConf.resolve.trigger;
            if (
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              supportContextResolveTriggerBrickLifeCycle.includes(lifecycleName)
            ) {
              const contextList =
                this.batchTriggerContextsNamesMap.get(lifecycleName) || [];
              contextList.push(dataConf.name);
              this.batchTriggerContextsNamesMap.set(lifecycleName, contextList);
            } else {
              // eslint-disable-next-line no-console
              console.error(`Unsupported lifecycle: "${lifecycleName}"`);
            }
          }
        } else if (!hasOwnProperty(dataConf, "value")) {
          return false;
        }
      }
      if ((!load || isLazyResolve) && dataConf.value !== undefined) {
        // If the context has no resolve, just use its `value`.
        // Or if the resolve is ignored or lazy, use its `value` as a fallback.
        value = await asyncComputeRealValue(dataConf.value, runtimeContext);
      }
    }

    const newData: DataStoreItem = {
      value,
      // This is required for tracking context, even if no `onChange` is specified.
      eventTarget: new EventTarget(),
      load,
      loaded: !isLazyResolve,
      deps: [],
    };

    if (dataConf.onChange) {
      newData.eventTarget.addEventListener(
        this.changeEventType,
        listenerFactory(dataConf.onChange, runtimeContext)
      );
    }

    if (dataConf.track) {
      const deps = strictCollectMemberUsage(
        load ? dataConf.resolve : dataConf.value,
        this.type
      );
      !load && (newData.deps = [...deps]);
      for (const dep of deps) {
        this.onChange(
          dep,
          this.batchAddListener(() => {
            if (load) {
              this.updateValue(dataConf.name, { cache: "default" }, "refresh");
            } else {
              this.updateValue(
                dataConf.name,
                computeRealValue(dataConf.value, runtimeContext),
                "replace"
              );
            }
          }, dataConf)
        );
      }
    }

    if (this.data.has(dataConf.name)) {
      throw new Error(
        `${this.type} '${dataConf.name}' has already been declared`
      );
    }
    this.data.set(dataConf.name, newData);

    return true;
  }

  batchAddListener(
    listener: EventListener,
    contextConf: ContextConf
  ): EventListener {
    return (event: Event | CustomEvent): void => {
      if (
        this.batchUpdate &&
        this.batchUpdateContextsNames.includes(contextConf.name)
      ) {
        return;
      }
      listener(event);
    };
  }

  getContextTriggerSetByLifecycle(
    lifecycle: ContextResolveTriggerBrickLifeCycle
  ): string[] {
    return this.batchTriggerContextsNamesMap.get(lifecycle) || [];
  }
}

export const supportContextResolveTriggerBrickLifeCycle = [
  "onBeforePageLoad",
  "onPageLoad",
  "onBeforePageLeave",
  "onPageLeave",
  "onAnchorLoad",
  "onAnchorUnload",
] as ContextResolveTriggerBrickLifeCycle[];
