import EventTarget from "@ungap/event-target";
import {
  BrickEventHandler,
  ContextConf,
  PluginRuntimeContext,
  StoryboardContextItem,
  StoryboardContextItemFreeVariable,
} from "@next-core/brick-types";
import {
  hasOwnProperty,
  resolveContextConcurrently,
  syncResolveContextConcurrently,
} from "@next-core/brick-utils";
import { looseCheckIf } from "../checkIf";
import { listenerFactory } from "../internal/bindListeners";
import { computeRealValue } from "../internal/setProperties";
import { RuntimeBrick, _internalApiGetResolver } from "./exports";

export class StoryboardContextWrapper {
  private readonly data = new Map<string, StoryboardContextItem>();

  constructor(private isScopedContext?: boolean) {}

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

  getValue(name: string): unknown {
    return (this.data.get(name) as StoryboardContextItemFreeVariable)?.value;
  }

  async define(
    contextConfs: ContextConf[],
    coreContext: PluginRuntimeContext,
    brick?: RuntimeBrick
  ): Promise<void> {
    if (Array.isArray(contextConfs)) {
      await resolveContextConcurrently(
        contextConfs,
        (contextConf: ContextConf) =>
          resolveStoryboardContext(
            this.isScopedContext,
            contextConf,
            coreContext,
            this,
            brick
          )
      );
    }
  }

  syncDefine(
    contextConfs: ContextConf[],
    coreContext: PluginRuntimeContext,
    brick?: RuntimeBrick
  ): void {
    if (Array.isArray(contextConfs)) {
      syncResolveContextConcurrently(contextConfs, (contextConf: ContextConf) =>
        resolveSyncStoryboardContext(contextConf, coreContext, this, brick)
      );
    }
  }
}

async function resolveStoryboardContext(
  isScopedContext: boolean,
  contextConf: ContextConf,
  coreContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick
): Promise<boolean> {
  if (contextConf.property) {
    if (isScopedContext) {
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
  coreContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick
): Promise<boolean> {
  if (!looseCheckIf(contextConf, coreContext)) {
    return false;
  }
  let isResolve = false;
  let value: unknown;
  if (contextConf.resolve) {
    if (looseCheckIf(contextConf.resolve, coreContext)) {
      isResolve = true;
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
        coreContext
      );
      value = valueConf.value;
    } else if (!hasOwnProperty(contextConf, "value")) {
      return false;
    }
  }
  if (!isResolve && contextConf.value !== undefined) {
    value = computeRealValue(contextConf.value, coreContext, true);
  }
  resolveFreeVariableValue(
    value,
    contextConf,
    coreContext,
    storyboardContextWrapper,
    brick
  );
  return true;
}

function resolveSyncStoryboardContext(
  contextConf: ContextConf,
  coreContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick
): boolean {
  if (!looseCheckIf(contextConf, coreContext)) {
    return false;
  }
  if (contextConf.resolve) {
    throw new Error("context.resolve is now allowed here");
  }
  const value = computeRealValue(contextConf.value, coreContext, true);
  resolveFreeVariableValue(
    value,
    contextConf,
    coreContext,
    storyboardContextWrapper,
    brick
  );
  return true;
}

function resolveFreeVariableValue(
  value: unknown,
  contextConf: ContextConf,
  coreContext: PluginRuntimeContext,
  storyboardContextWrapper: StoryboardContextWrapper,
  brick?: RuntimeBrick
): void {
  const newContext: StoryboardContextItem = {
    type: "free-variable",
    value,
    // This is required for tracking context, even if no `onChange` is specified.
    eventTarget: new EventTarget(),
  };
  if (contextConf.onChange) {
    for (const handler of ([] as BrickEventHandler[]).concat(
      contextConf.onChange
    )) {
      newContext.eventTarget.addEventListener(
        "context.change",
        listenerFactory(handler, coreContext, brick)
      );
    }
  }
  storyboardContextWrapper.set(contextConf.name, newContext);
}
