import EventTarget from "@ungap/event-target";
import {
  BrickEventHandler,
  BrickEventHandlerCallback,
  ContextConf,
  PluginRuntimeContext,
  ResolveOptions,
  StoryboardContextItem,
  StoryboardContextItemFreeVariable,
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
} from "@next-core/brick-utils";
import { looseCheckIf } from "../checkIf";
import {
  eventCallbackFactory,
  listenerFactory,
} from "../internal/bindListeners";
import { computeRealValue } from "../internal/setProperties";
import { RuntimeBrick, _internalApiGetCurrentContext } from "./exports";
import { _internalApiGetResolver } from "./Runtime";
import { handleHttpError } from "../handleHttpError";

export class StoryboardContextWrapper {
  private readonly data = new Map<string, StoryboardContextItem>();
  readonly tplContextId: string;
  readonly formContextId: string;
  readonly pendingStack: Array<
    ReturnType<typeof deferResolveContextConcurrently>
  > = [];

  constructor(tplContextId?: string, formContextId?: string) {
    this.tplContextId = tplContextId;
    this.formContextId = formContextId;
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
              new CustomEvent(
                this.formContextId
                  ? "formstate.change"
                  : this.tplContextId
                  ? "state.change"
                  : "context.change",
                {
                  detail: item.value,
                }
              )
            );
          },
          (err) => {
            // Let users to override error handling.
            if (!callback?.error) {
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
          `Non-object current value of context "${name}" for "context.assign", try "context.replace" instead.`
        );
        item.value = value;
      }
    }

    item.eventTarget?.dispatchEvent(
      new CustomEvent(
        this.formContextId
          ? "formstate.change"
          : this.tplContextId
          ? "state.change"
          : "context.change",
        {
          detail: item.value,
        }
      )
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

  deferDefine(
    contextConfs: ContextConf[],
    coreContext: PluginRuntimeContext,
    brick?: RuntimeBrick
  ): void {
    const { mergedContext, keyword } = this.getResolveOptions(coreContext);
    const pending = deferResolveContextConcurrently(
      Array.isArray(contextConfs) ? contextConfs : [],
      (contextConf: ContextConf) =>
        resolveStoryboardContext(contextConf, mergedContext, this, brick),
      keyword
    );
    this.pendingStack.push(pending);
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
    return this.tplContextId
      ? {
          mergedContext: { ...coreContext, tplContextId: this.tplContextId },
          keyword: "STATE",
        }
      : {
          mergedContext: coreContext,
          keyword: "CTX",
        };
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
  let isLazyResolve = false;
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
        isLazyResolve = contextConf.resolve.lazy;
        if (!isLazyResolve) {
          value = await load();
        }
      } else if (!hasOwnProperty(contextConf, "value")) {
        return false;
      }
    }
    if ((!load || isLazyResolve) && contextConf.value !== undefined) {
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
    !isLazyResolve
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
  loaded?: boolean
): void {
  const newContext: StoryboardContextItem = {
    type: "free-variable",
    value,
    // This is required for tracking context, even if no `onChange` is specified.
    eventTarget: new EventTarget(),
    load,
    loaded,
  };
  if (contextConf.onChange) {
    for (const handler of ([] as BrickEventHandler[]).concat(
      contextConf.onChange
    )) {
      newContext.eventTarget.addEventListener(
        storyboardContextWrapper.formContextId
          ? "formstate.change"
          : storyboardContextWrapper.tplContextId
          ? "state.change"
          : "context.change",
        listenerFactory(handler, mergedContext, brick)
      );
    }
  }

  if (contextConf.track) {
    const isTemplateState = !!storyboardContextWrapper.tplContextId;
    // Track its dependencies and auto update when each of them changed.
    const deps = (isTemplateState ? trackUsedState : trackUsedContext)(
      load ? contextConf.resolve : contextConf.value
    );
    for (const dep of deps) {
      const ctx = storyboardContextWrapper.get().get(dep);
      (ctx as StoryboardContextItemFreeVariable)?.eventTarget?.addEventListener(
        storyboardContextWrapper.formContextId
          ? "formstate.change"
          : isTemplateState
          ? "state.change"
          : "context.change",
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
        }
      );
    }
  }

  storyboardContextWrapper.set(contextConf.name, newContext);
}
