import type {
  BatchUpdateContextItem,
  BrickEventHandlerCallback,
  ContextConf,
  ContextResolveTriggerBrickLifeCycle,
  RouteConf,
} from "@next-core/types";
import { hasOwnProperty, isObject } from "@next-core/utils/general";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";
import EventTarget from "@ungap/event-target";
import { eventCallbackFactory, listenerFactory } from "../bindListeners.js";
import { asyncCheckIf, checkIf } from "../compute/checkIf.js";
import {
  asyncComputeRealValue,
  computeRealValue,
} from "../compute/computeRealValue.js";
import { ResolveOptions, resolveData } from "./resolveData.js";
import { resolveDataStore } from "./resolveDataStore.js";
import type {
  AsyncPropertyEntry,
  RuntimeBrick,
  RuntimeContext,
} from "../interfaces.js";
import { handleHttpError } from "../../handleHttpError.js";
import type { RendererContext } from "../RendererContext.js";
import { computePropertyValue } from "../compute/computeRealProperties.js";
import { _internalApiGetRenderId } from "../Runtime.js";
import {
  callRealTimeDataInspectHooks,
  realTimeDataInspectRoot,
} from "./realTimeDataInspect.js";
import { isStrictMode } from "../../isStrictMode.js";

const supportContextResolveTriggerBrickLifeCycle = [
  "onBeforePageLoad",
  "onPageLoad",
  "onBeforePageLeave",
  "onPageLeave",
  "onAnchorLoad",
  "onAnchorUnload",
] as ContextResolveTriggerBrickLifeCycle[];

export type DataStoreType = "CTX" | "STATE" | "FORM_STATE";

export interface DataStoreItem {
  name: string;
  value: unknown;
  eventTarget: EventTarget;
  useResolve?: boolean;
  loaded?: boolean;
  loading?: Promise<unknown>;
  load?: (options?: ResolveOptions) => Promise<unknown>;
  async?: boolean;
  asyncMounted?: boolean;
  deps: string[];
}

export class DataStore<T extends DataStoreType = "CTX"> {
  private readonly type: T;
  private readonly data = new Map<string, DataStoreItem>();
  private readonly changeEventType: string;
  private readonly pendingStack: Array<ReturnType<typeof resolveDataStore>> =
    [];
  public readonly hostBrick?: RuntimeBrick;
  private readonly stateStoreId?: string;
  private batchUpdate = false;
  private batchUpdateContextsNames: string[] = [];
  private readonly rendererContext?: RendererContext;
  private routeMap = new WeakMap<RouteConf, Set<string>>();

  // 把 `rendererContext` 放在参数列表的最后，并作为可选，以减少测试文件的调整
  constructor(
    type: T,
    hostBrick?: RuntimeBrick,
    rendererContext?: RendererContext,
    stateStoreId?: string
  ) {
    this.type = type;
    this.changeEventType =
      this.type === "FORM_STATE"
        ? "formstate.change"
        : this.type === "STATE"
          ? "state.change"
          : "context.change";
    this.hostBrick = hostBrick;
    this.rendererContext = rendererContext;
    this.stateStoreId = stateStoreId;
  }

  getAllValues(): Record<string, unknown> {
    return Object.fromEntries(
      [...this.data.entries()].map(([name, { value }]) => [name, value])
    );
  }

  getValue(name: string): unknown {
    return this.data.get(name)?.value;
  }

  private notifyRealTimeDataChange(name: string, value: unknown) {
    if (realTimeDataInspectRoot) {
      const { tplStateStoreId } = realTimeDataInspectRoot;
      if (
        tplStateStoreId
          ? this.type === "STATE" && this.stateStoreId === tplStateStoreId
          : this.type === "CTX"
      ) {
        callRealTimeDataInspectHooks({
          changeType: "update",
          tplStateStoreId,
          detail: {
            name,
            value,
          },
        });
      }
    }
  }

  private getAffectListByContext(name: string): string[] {
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
      if (!item.useResolve) {
        throw new Error(
          `You can not ${method} "${this.type}.${name}" which is not using resolve`
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

      const shouldDismiss = (error: unknown) => {
        // If render twice immediately, flow API contracts maybe cleared before
        // the second rendering, while the page load handlers of the first
        // rendering can't be cancelled, which throws `FlowApiNotFoundError`.
        // So we ignore error reporting for this case.
        let renderId: string | undefined;
        return (
          (error as Error)?.name === "FlowApiNotFoundError" &&
          !!(renderId = this.rendererContext?.renderId) &&
          renderId !== _internalApiGetRenderId()
        );
      };

      if (!promise) {
        promise = item.loading = item.load!({
          cache: method === "load" ? "default" : "reload",
          ...(value as ResolveOptions),
        });
        // Do not use the chained promise, since the callbacks need the original promise.
        promise.then(
          (val) => {
            this.finishLoad(item, val);
          },
          (err) => {
            // Let users override error handling.
            if (item.useResolve && !shouldDismiss(err) && !callback?.error) {
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
            if (!shouldDismiss(err) && callback.error) {
              callbackFactory("error")(err);
            }
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

  private finishLoad(item: DataStoreItem, value: unknown) {
    if (!item.useResolve) {
      // This happens when a tracked conditional resolve switches from
      // resolve to fallback after an dep update triggered refresh but
      // before it's been resolved.
      return;
    }
    item.loaded = true;
    item.value = value;
    item.eventTarget.dispatchEvent(
      new CustomEvent(this.changeEventType, {
        detail: value,
      })
    );
  }

  define(
    dataConfs: ContextConf[] | undefined,
    runtimeContext: RuntimeContext,
    asyncHostPropertyEntries?: AsyncPropertyEntry[],
    routePath?: RouteConf[]
  ): void {
    if (Array.isArray(dataConfs) && dataConfs.length > 0) {
      const pending = resolveDataStore(
        dataConfs,
        (dataConf: ContextConf) =>
          this.resolve(
            dataConf,
            runtimeContext,
            asyncHostPropertyEntries,
            routePath
          ),
        this.type,
        isStrictMode(runtimeContext)
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
    // Silent each pending contexts, since the error is handled by batched `pendingResult`
    for (const { pendingContexts } of this.pendingStack) {
      for (const p of pendingContexts.values()) {
        p.catch(() => {
          /* No-op */
        });
      }
    }
    for (const { pendingResult } of this.pendingStack) {
      await pendingResult;
    }
  }

  /**
   * After mount, dispatch the change event when an async data is loaded.
   *
   * If param `route` is present, handle data defined in that route (or its descendants) only.
   */
  mountAsyncData(route?: RouteConf) {
    this.data.forEach((item) => {
      if (item.async && (!route || this.routeMap.get(route)?.has(item.name))) {
        // istanbul ignore next
        if (item.asyncMounted) {
          // eslint-disable-next-line no-console
          console.error(
            `Async data "${item.name}" already mounted. This is a bug of Brick Next, please report it.`
          );
          return;
        }
        item.asyncMounted = true;
        // An async data always has `loading`
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        item.loading!.then((value) => {
          this.finishLoad(item, value);
        });
      }
    });
  }

  private async resolve(
    dataConf: ContextConf,
    runtimeContext: RuntimeContext,
    asyncHostPropertyEntries?: AsyncPropertyEntry[],
    routePath?: RouteConf[]
  ): Promise<boolean> {
    if (!(await asyncCheckIf(dataConf, runtimeContext))) {
      return false;
    }
    let value: unknown;
    if (
      asyncHostPropertyEntries &&
      (this.type === "STATE" ? dataConf.expose : this.type === "FORM_STATE")
    ) {
      value = await computePropertyValue(
        asyncHostPropertyEntries,
        dataConf.name
      );
    }
    let load: DataStoreItem["load"];
    let loading: Promise<unknown> | undefined;
    let useResolve: boolean | undefined;
    let trackConditionalResolve: boolean | undefined;
    let resolvePolicy: "eager" | "lazy" | "async" | undefined;
    if (value === undefined) {
      if (dataConf.resolve) {
        const hasFallbackValue = hasOwnProperty(dataConf, "value");
        // Track conditional resolve only if all matches:
        //   - Track enabled
        //   - Has fallback value
        //   - Referencing other data in `resolve.if`
        trackConditionalResolve =
          dataConf.track &&
          hasFallbackValue &&
          hasOwnProperty(dataConf.resolve, "if") &&
          strictCollectMemberUsage(dataConf.resolve.if, this.type).size > 0;
        const resolveConf = {
          transform: "value",
          ...dataConf.resolve,
        };
        useResolve = await asyncCheckIf(dataConf.resolve, runtimeContext);
        if (useResolve || trackConditionalResolve) {
          load = async (options) =>
            (
              (await resolveData(resolveConf, runtimeContext, {
                ...options,
                renderId: this.rendererContext?.renderId,
              })) as {
                value: unknown;
              }
            ).value;
        }
        if (useResolve) {
          // `async` take precedence over `lazy`
          resolvePolicy = dataConf.resolve.async
            ? "async"
            : dataConf.resolve.lazy
              ? "lazy"
              : "eager";
          if (resolvePolicy === "eager") {
            value = await load!();
          } else if (resolvePolicy === "async") {
            loading = load!();
          }
        } else if (!hasFallbackValue) {
          return false;
        }
      }
      if (
        (!useResolve || resolvePolicy !== "eager") &&
        dataConf.value !== undefined
      ) {
        // If the context has no resolve, just use its `value`.
        // Or if the resolve is ignored or lazy, use its `value` as a fallback.
        value = await asyncComputeRealValue(dataConf.value, runtimeContext);
      }
    }

    if (this.data.has(dataConf.name)) {
      throw new Error(
        `${this.type} '${dataConf.name}' has already been declared`
      );
    }

    const newData: DataStoreItem = {
      name: dataConf.name,
      value,
      // This is required for tracking context, even if no `onChange` is specified.
      eventTarget: new EventTarget(),
      useResolve,
      load,
      loaded: resolvePolicy === "eager",
      loading,
      async: resolvePolicy === "async",
      deps: [],
    };

    if (resolvePolicy === "lazy") {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { trigger } = dataConf.resolve!;
      if (
        trigger &&
        supportContextResolveTriggerBrickLifeCycle.includes(trigger)
      ) {
        this.rendererContext?.registerArbitraryLifeCycle(trigger, () => {
          this.updateValue(dataConf.name, undefined, "load");
        });
      }
    }

    if (dataConf.onChange) {
      newData.eventTarget.addEventListener(
        this.changeEventType,
        listenerFactory(dataConf.onChange, runtimeContext)
      );
    }

    if (dataConf.track) {
      const deps = strictCollectMemberUsage(
        trackConditionalResolve
          ? [dataConf.resolve, dataConf.value]
          : load
            ? dataConf.resolve
            : dataConf.value,
        this.type
      );
      !load && (newData.deps = [...deps]);
      for (const dep of deps) {
        this.onChange(
          dep,
          this.batchAddListener(() => {
            newData.useResolve = trackConditionalResolve
              ? checkIf(dataConf.resolve!, runtimeContext)
              : !!load;
            if (newData.useResolve) {
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

    newData.eventTarget.addEventListener(this.changeEventType, (e) => {
      this.notifyRealTimeDataChange(dataConf.name, (e as CustomEvent).detail);
    });

    this.data.set(dataConf.name, newData);

    if (Array.isArray(routePath)) {
      for (const route of routePath) {
        const names = this.routeMap.get(route);
        if (names) {
          names.add(dataConf.name);
        } else {
          this.routeMap.set(route, new Set([dataConf.name]));
        }
      }
    }

    return true;
  }

  disposeDataInRoutes(routes: RouteConf[]) {
    for (const route of routes) {
      const names = this.routeMap.get(route);
      if (names !== undefined) {
        for (const name of names) {
          this.data.delete(name);
        }
      }
    }
  }

  private batchAddListener(
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
}
