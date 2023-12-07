import EventTarget from "@ungap/event-target";
import {
  BatchUpdateContextItem,
  BrickEventHandler,
  BrickEventHandlerCallback,
  ContextConf,
  PluginRuntimeContext,
  ResolveOptions,
  StoryboardContextItem,
  StoryboardContextItemFreeVariable,
  ContextResolveTriggerBrickLifeCycle,
} from "@next-core/brick-types";
import {
  hasOwnProperty,
  isObject,
  resolveContextConcurrently,
  deferResolveContextConcurrently,
  syncResolveContextConcurrently,
  trackUsedContext,
  trackUsedState,
  collectContextUsage,
  trackUsedFormState,
} from "@next-core/brick-utils";
import { looseCheckIf } from "../checkIf";
import {
  eventCallbackFactory,
  listenerFactory,
} from "../internal/bindListeners";
import { computeRealValue } from "../internal/setProperties";
import {
  RuntimeBrick,
  _internalApiGetCurrentContext,
  _internalApiGetRouterRenderId,
} from "./exports";
import { _internalApiGetResolver } from "./Runtime";
import { handleHttpError } from "../handleHttpError";
import {
  callRealTimeDataInspectHooks,
  realTimeDataInspectRoot,
} from "./realTimeDataInspect";

export class StoryboardContextWrapper {
  private readonly data = new Map<string, StoryboardContextItem>();
  batchUpdate = false;
  batchUpdateContextsNames: string[] = [];
  readonly batchTriggerContextsNamesMap: Map<
    ContextResolveTriggerBrickLifeCycle,
    { type: "context" | "state"; name: string; tplContextId: string }[]
  > = new Map();
  readonly tplContextId: string;
  readonly formContextId: string;
  readonly eventName: string;
  readonly pendingStack: Array<
    ReturnType<typeof deferResolveContextConcurrently>
  > = [];
  readonly renderId: string;

  constructor(
    tplContextId?: string,
    formContextId?: string,
    renderId?: string
  ) {
    this.tplContextId = tplContextId;
    this.formContextId = formContextId;
    this.eventName = this.formContextId
      ? "formstate.change"
      : this.tplContextId
      ? "state.change"
      : "context.change";
    this.renderId = renderId;
  }

  set(name: string, item: StoryboardContextItem): void {
    if (this.data.has(name)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Storyboard context "${name}" have already existed, it will be replaced.`
      );
    }
    this.data.set(name, item);
  }

  get(): Map<string, StoryboardContextItem> {
    return this.data;
  }

  /** Get value of free-variable only. */
  getValue(name: string): unknown {
    return (this.data.get(name) as StoryboardContextItemFreeVariable)?.value;
  }

  notifyRealTimeDataChange(name: string, value: unknown): void {
    if (realTimeDataInspectRoot) {
      const { tplStateStoreId } = realTimeDataInspectRoot;
      if (
        tplStateStoreId
          ? this.tplContextId === tplStateStoreId
          : !this.tplContextId && !this.formContextId
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

  getAffectListByContext(name: string): string[] {
    const affectNames = [name];
    this.data.forEach((value, key) => {
      if (value.type === "free-variable" && value.deps) {
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

    const updateContexts: Record<string, StoryboardContextItemFreeVariable> =
      {};
    const affectContexts: Record<string, StoryboardContextItemFreeVariable> =
      {};
    const affectDepsContextNames: string[] = [];

    values.forEach((arg) => {
      const { name, value } = argsFactory([arg]);
      const updateContextItem = this.data.get(name);
      affectDepsContextNames.push(...this.getAffectListByContext(name));
      updateContextItem.type === "free-variable" &&
        (updateContexts[name] = updateContextItem);
      this.updateValue(name as string, value, method);
    });

    affectDepsContextNames
      .filter((item) => !updateContexts[item])
      .forEach((name) => {
        const affectContextItem = this.data.get(name);
        affectContextItem.type === "free-variable" &&
          (affectContexts[name] = affectContextItem);
      });

    const triggerEvent = (
      contexts: Record<string, StoryboardContextItemFreeVariable>
    ): void => {
      for (const key in contexts) {
        const context = contexts[key];
        context.eventTarget?.dispatchEvent(
          new CustomEvent(this.eventName, {
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
    callback?: BrickEventHandlerCallback
  ): void {
    if (!this.data.has(name)) {
      if (this.tplContextId) {
        throw new Error(`State not found: ${name}`);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `Context "${name}" is not declared, we recommend declaring it first.`
        );
        this.set(name, {
          type: "free-variable",
          value,
        });
        return;
      }
    }

    const item = this.data.get(name) as StoryboardContextItemFreeVariable;
    if (item.type !== "free-variable") {
      // eslint-disable-next-line no-console
      console.error(
        `Unexpected storyboard context "${name}", expected "free-variable", received "${item.type}".`
      );
      return;
    }

    if (method === "refresh" || method === "load") {
      if (!item.load) {
        throw new Error(
          `You can not ${method} the storyboard context "${name}" which has no resolve.`
        );
      }

      let promise: Promise<unknown>;
      if (method === "load") {
        // Try to reuse previous request when calling `load`.
        if (item.loaded) {
          promise = Promise.resolve(item.value);
        } else if (item.loading) {
          promise = item.loading;
        }
      }

      const shouldDismiss = (error: unknown): boolean => {
        // If render twice immediately, flow API contracts maybe cleared before
        // the second rendering, while the page load handlers of the first
        // rendering can't be cancelled, which throws `FlowApiNotFoundError`.
        // So we ignore error reporting for this case.
        return (
          (error as Error)?.name === "FlowApiNotFoundError" &&
          this.renderId &&
          this.renderId !== _internalApiGetRouterRenderId()
        );
      };

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
              new CustomEvent(this.eventName, {
                detail: item.value,
              })
            );
          },
          (err) => {
            // Let users to override error handling.
            if (!shouldDismiss(err) && !callback?.error) {
              handleHttpError(err);
            }
          }
        );
      }

      if (callback) {
        const callbackFactory = eventCallbackFactory(
          callback,
          () =>
            this.getResolveOptions(_internalApiGetCurrentContext())
              .mergedContext,
          null
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
          `Non-object current value of context "${name}" for "context.assign", try "context.replace" instead.`
        );
        item.value = value;
      }
    }

    if (this.batchUpdate) return;

    item.eventTarget?.dispatchEvent(
      new CustomEvent(this.eventName, {
        detail: item.value,
      })
    );
  }

  async waitForUsedContext(data: unknown): Promise<void> {
    if (this.tplContextId || this.formContextId) {
      return;
    }
    const usage = collectContextUsage(data, "CTX");
    if (usage.includesComputed) {
      for (const pending of this.pendingStack) {
        await pending.pendingResult;
      }
    } else if (usage.usedContexts.length > 0) {
      for (const { pendingContexts } of this.pendingStack) {
        await Promise.all(
          usage.usedContexts.map((ctx) => pendingContexts.get(ctx))
        );
      }
    }
  }

  async waitForAllContext(): Promise<void> {
    if (this.tplContextId || this.formContextId) {
      return;
    }
    for (const pending of this.pendingStack) {
      await pending.pendingResult;
    }
  }

  /** After mount, dispatch the change event when an async data is loaded */
  handleAsyncAfterMount(): void {
    this.data.forEach((item) => {
      if (item.type === "free-variable" && item.async) {
        // An async data always has `loading`
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        item.loading!.then((value) => {
          item.loaded = true;
          item.value = value;
          item.eventTarget.dispatchEvent(
            new CustomEvent(this.eventName, {
              detail: value,
            })
          );
        });
      }
    });
  }

  deferDefine(
    contextConfs: ContextConf[],
    coreContext: PluginRuntimeContext,
    brick?: RuntimeBrick
  ): void {
    const { mergedContext, keyword } = this.getResolveOptions(coreContext);
    if (Array.isArray(contextConfs) && contextConfs.length > 0) {
      const pending = deferResolveContextConcurrently(
        contextConfs,
        (contextConf: ContextConf) =>
          resolveStoryboardContext(contextConf, mergedContext, this, brick),
        keyword
      );
      this.pendingStack.push(pending);
    }
  }

  async define(
    contextConfs: ContextConf[],
    coreContext: PluginRuntimeContext,
    brick?: RuntimeBrick
  ): Promise<void> {
    if (Array.isArray(contextConfs)) {
      const { mergedContext, keyword } = this.getResolveOptions(coreContext);
      await resolveContextConcurrently(
        contextConfs,
        (contextConf: ContextConf) =>
          resolveStoryboardContext(contextConf, mergedContext, this, brick),
        keyword
      );
    }
  }

  syncDefine(
    contextConfs: ContextConf[],
    coreContext: PluginRuntimeContext,
    brick: RuntimeBrick
  ): void {
    if (Array.isArray(contextConfs)) {
      const { mergedContext, keyword } = this.getResolveOptions(coreContext);
      syncResolveContextConcurrently(
        contextConfs,
        (contextConf: ContextConf) =>
          syncResolveStoryboardContext(contextConf, mergedContext, this, brick),
        keyword
      );
    }
  }

  private getResolveOptions(coreContext: PluginRuntimeContext): {
    mergedContext: PluginRuntimeContext;
    keyword: string;
  } {
    return this.formContextId
      ? {
          mergedContext: { ...coreContext, formContextId: this.formContextId },
          keyword: "FORM_STATE",
        }
      : this.tplContextId
      ? {
          mergedContext: { ...coreContext, tplContextId: this.tplContextId },
          keyword: "STATE",
        }
      : {
          mergedContext: coreContext,
          keyword: "CTX",
        };
  }

  getContextTriggerSetByLifecycle(
    lifecycle: ContextResolveTriggerBrickLifeCycle
  ): { type: "context" | "state"; name: string; tplContextId: string }[] {
    return this.batchTriggerContextsNamesMap.get(lifecycle) || [];
  }
}

async function resolveStoryboardContext(
  contextConf: ContextConf,
  coreContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick
): Promise<boolean> {
  if (contextConf.property) {
    if (storyboardContextWrapper.tplContextId) {
      throw new Error(
        "Setting `property` is not allowed in template scoped context"
      );
    }
    if (brick) {
      storyboardContextWrapper.set(contextConf.name, {
        type: "brick-property",
        brick,
        prop: contextConf.property,
      });
    }
    return true;
  }
  return resolveNormalStoryboardContext(
    contextConf,
    coreContext,
    storyboardContextWrapper,
    brick
  );
}

const supportContextResolveTriggerBrickLifeCycle = [
  "onBeforePageLoad",
  "onPageLoad",
  "onBeforePageLeave",
  "onPageLeave",
  "onAnchorLoad",
  "onAnchorUnload",
];
async function resolveNormalStoryboardContext(
  contextConf: ContextConf,
  mergedContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick
): Promise<boolean> {
  await storyboardContextWrapper.waitForUsedContext(contextConf.if);
  if (!looseCheckIf(contextConf, mergedContext)) {
    return false;
  }
  const isTemplateState = !!storyboardContextWrapper.tplContextId;
  let value = getDefinedTemplateState(isTemplateState, contextConf, brick);
  let load: StoryboardContextItemFreeVariable["load"] = null;
  let loading: Promise<unknown> | undefined;
  let resolvePolicy: "eager" | "lazy" | "async" = "eager";
  if (value === undefined) {
    if (contextConf.resolve) {
      await storyboardContextWrapper.waitForUsedContext(contextConf.resolve.if);
      if (looseCheckIf(contextConf.resolve, mergedContext)) {
        load = async (options) => {
          const valueConf: Record<string, unknown> = {};
          await _internalApiGetResolver().resolveOne(
            "reference",
            {
              transform: "value",
              transformMapArray: false,
              ...contextConf.resolve,
            },
            valueConf,
            null,
            mergedContext,
            options
          );
          return valueConf.value;
        };
        // `async` take precedence over `lazy`
        resolvePolicy =
          contextConf.resolve.async && !isTemplateState
            ? "async"
            : contextConf.resolve.lazy
            ? "lazy"
            : "eager";
        if (resolvePolicy === "eager") {
          value = await load();
        } else if (resolvePolicy === "async") {
          loading = load();
        } else if (contextConf.resolve.trigger) {
          const lifecycleName = contextConf.resolve.trigger;
          if (
            supportContextResolveTriggerBrickLifeCycle.includes(lifecycleName)
          ) {
            const contextNameArray =
              storyboardContextWrapper.batchTriggerContextsNamesMap.get(
                lifecycleName
              ) || [];
            contextNameArray.push({
              name: contextConf.name,
              type: storyboardContextWrapper.tplContextId ? "state" : "context",
              tplContextId: storyboardContextWrapper.tplContextId,
            });
            storyboardContextWrapper.batchTriggerContextsNamesMap.set(
              lifecycleName,
              contextNameArray
            );
          } else {
            // eslint-disable-next-line no-console
            console.error(`unsupported lifecycle: "${lifecycleName}"`);
          }
        }
      } else if (!hasOwnProperty(contextConf, "value")) {
        return false;
      }
    }
    if (
      (!load || resolvePolicy !== "eager") &&
      contextConf.value !== undefined
    ) {
      await storyboardContextWrapper.waitForUsedContext(contextConf.value);
      // If the context has no resolve, just use its `value`.
      // Or if the resolve is ignored or lazy, use its `value` as a fallback.
      value = computeRealValue(contextConf.value, mergedContext, true);
    }
  }

  resolveFreeVariableValue(
    value,
    contextConf,
    mergedContext,
    storyboardContextWrapper,
    brick,
    load,
    resolvePolicy === "eager",
    loading,
    resolvePolicy === "async"
  );
  return true;
}

function syncResolveStoryboardContext(
  contextConf: ContextConf,
  mergedContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick
): boolean {
  if (!looseCheckIf(contextConf, mergedContext)) {
    return false;
  }
  if (contextConf.resolve) {
    throw new Error("resolve is not allowed here");
  }
  let value = getDefinedTemplateState(
    !!storyboardContextWrapper.tplContextId,
    contextConf,
    brick
  );
  if (value === undefined) {
    value = computeRealValue(contextConf.value, mergedContext, true);
  }
  resolveFreeVariableValue(
    value,
    contextConf,
    mergedContext,
    storyboardContextWrapper,
    brick
  );
  return true;
}

function getDefinedTemplateState(
  isTemplateState: boolean,
  contextConf: ContextConf,
  brick: RuntimeBrick
): unknown {
  if (
    isTemplateState &&
    brick.properties &&
    hasOwnProperty(brick.properties, contextConf.name)
  ) {
    return brick.properties[contextConf.name];
  }
}

function resolveFreeVariableValue(
  value: unknown,
  contextConf: ContextConf,
  mergedContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick,
  load?: StoryboardContextItemFreeVariable["load"],
  loaded?: boolean,
  loading?: Promise<unknown>,
  async?: boolean
): void {
  const newContext: StoryboardContextItem = {
    type: "free-variable",
    value,
    // This is required for tracking context, even if no `onChange` is specified.
    eventTarget: new EventTarget(),
    load,
    loaded,
    loading,
    async,
    deps: [],
  };

  const eventName = storyboardContextWrapper.formContextId
    ? "formstate.change"
    : storyboardContextWrapper.tplContextId
    ? "state.change"
    : "context.change";

  if (contextConf.onChange) {
    for (const handler of ([] as BrickEventHandler[]).concat(
      contextConf.onChange
    )) {
      newContext.eventTarget.addEventListener(
        eventName,
        listenerFactory(handler, mergedContext, brick)
      );
    }
  }

  newContext.eventTarget.addEventListener(eventName, (e) => {
    storyboardContextWrapper.notifyRealTimeDataChange(
      contextConf.name,
      (e as CustomEvent).detail
    );
  });

  if (contextConf.track) {
    const isTemplateState = !!storyboardContextWrapper.tplContextId;
    const isFormState = !!storyboardContextWrapper.formContextId;
    // Track its dependencies and auto update when each of them changed.
    const deps = (
      isFormState
        ? trackUsedFormState
        : isTemplateState
        ? trackUsedState
        : trackUsedContext
    )(load ? contextConf.resolve : contextConf.value);
    !load && (newContext.deps = deps);
    for (const dep of deps) {
      const ctx = storyboardContextWrapper.get().get(dep);
      (ctx as StoryboardContextItemFreeVariable)?.eventTarget?.addEventListener(
        eventName,
        batchAddListener(
          () => {
            if (load) {
              storyboardContextWrapper.updateValue(
                contextConf.name,
                { cache: "default" },
                "refresh"
              );
            } else {
              storyboardContextWrapper.updateValue(
                contextConf.name,
                computeRealValue(contextConf.value, mergedContext, true),
                "replace"
              );
            }
          },
          contextConf,
          storyboardContextWrapper
        )
      );
    }
  }

  storyboardContextWrapper.set(contextConf.name, newContext);
}

function batchAddListener(
  listener: EventListener,
  contextConf: ContextConf,
  storyboardContextWrapper: StoryboardContextWrapper
): EventListener {
  return (event: Event | CustomEvent): void => {
    if (
      storyboardContextWrapper.batchUpdate &&
      storyboardContextWrapper.batchUpdateContextsNames.includes(
        contextConf.name
      )
    ) {
      return;
    }
    listener(event);
  };
}
