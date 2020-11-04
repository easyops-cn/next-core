import { get } from "lodash";
import {
  BrickConf,
  PluginRuntimeContext,
  RuntimeBrickConf,
  RefResolveConf,
  EntityResolveConf,
  DefineResolveConf,
  ResolveConf,
  HandleRejectByTransform,
  UseProviderResolveConf,
  SelectorProviderResolveConf,
  HandleReject,
  HandleRejectByCatch,
} from "@easyops/brick-types";
import { asyncProcessBrick } from "@easyops/brick-utils";
import { computeRealValue } from "../setProperties";
import { Kernel, RuntimeBrick } from "./exports";
import {
  makeProviderRefreshable,
  RefreshableProvider,
  IntervalSettings,
} from "../makeProviderRefreshable";
import { brickTemplateRegistry } from "./TemplateRegistries";
import {
  transformProperties,
  transformIntermediateData,
} from "../transformProperties";
import { recursiveMarkAsInjected } from "../injected";
import { isCustomApiProvider, getArgsOfCustomApi } from "./CustomApis";
import { looseCheckIf } from "../checkIf";

export class Resolver {
  private readonly cache: Map<string, Promise<any>> = new Map();
  private refreshQueue: Map<RefreshableProvider, IntervalSettings> = new Map();
  private readonly definedResolves: Map<string, DefineResolveConf> = new Map();
  private active = true;

  constructor(private kernel: Kernel) {}

  resetRefreshQueue(): void {
    if (this.refreshQueue.size > 0) {
      for (const interval of this.refreshQueue.values()) {
        clearTimeout(interval.timeoutId);
      }
      this.refreshQueue = new Map();
    }
    this.active = false;
  }

  defineResolves(
    resolves: DefineResolveConf[],
    context: PluginRuntimeContext
  ): void {
    if (Array.isArray(resolves)) {
      for (const resolveConf of resolves) {
        this.definedResolves.set(resolveConf.id, {
          ...resolveConf,
          args: computeRealValue(resolveConf.args, context, true),
        });
      }
    }
  }

  async resolve(
    brickConf: BrickConf,
    brick: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void> {
    const useResolves = (brickConf.lifeCycle?.useResolves ?? []).filter(
      (r: ResolveConf) => {
        return looseCheckIf(r, context);
      }
    );

    await Promise.all(
      useResolves.map((resolveConf: ResolveConf) =>
        this.resolveOne("brick", resolveConf, brickConf, brick, context)
      )
    );
    if (brickConf.template) {
      (brickConf as RuntimeBrickConf).$$resolved = true;

      // Try to process templates.
      await asyncProcessBrick(
        brickConf,
        brickTemplateRegistry,
        this.kernel.bootstrapData.templatePackages
      );

      // Try to load deps for dynamic added bricks.
      await this.kernel.loadDynamicBricksInBrickConf(brickConf);
    }
  }

  async resolveOne(
    type: "brick",
    resolveConf: ResolveConf,
    conf: BrickConf,
    brick?: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void>;
  async resolveOne(
    type: "reference",
    resolveConf: ResolveConf,
    conf: Record<string, any>,
    brick?: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void>;
  async resolveOne(
    type: "brick" | "reference",
    resolveConf: ResolveConf,
    conf: BrickConf | Record<string, any>,
    brick?: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void> {
    const brickConf = conf as BrickConf;
    const propsReference = conf as Record<string, any>;
    let actualResolveConf: EntityResolveConf;
    const { ref } = resolveConf as RefResolveConf;
    if (ref) {
      if (!this.definedResolves.has(ref)) {
        throw new Error(
          `Provider ref not found: "${ref}" in ${
            type === "reference"
              ? "reference"
              : brickConf.template
              ? `template ${brickConf.template}`
              : `brick ${brick.type}`
          }`
        );
      }
      actualResolveConf = this.definedResolves.get(ref);
    } else {
      actualResolveConf = resolveConf as EntityResolveConf;
    }

    let data: any;
    const {
      name,
      provider,
      useProvider,
      method = "resolve",
      args,
      field,
      transformFrom,
      transformMapArray,
      transform,
    } = actualResolveConf as UseProviderResolveConf &
      SelectorProviderResolveConf;

    let providerBrick: RefreshableProvider;

    if (useProvider) {
      providerBrick = (await this.kernel.getProviderBrick(useProvider)) as any;
    } else {
      providerBrick = this.kernel.mountPoints.bg.querySelector(provider);

      if (!providerBrick) {
        throw new Error(
          `Provider not found: "${provider}" in ${
            type === "reference"
              ? "reference"
              : brickConf.template
              ? `template ${brickConf.template}`
              : `brick ${brick.type}`
          }`
        );
      }

      const providerTagName = providerBrick.tagName.toLowerCase();

      if (!customElements.get(providerTagName)) {
        throw new Error(
          `Provider not defined: "${providerTagName}", please make sure the related package is installed.`
        );
      }

      makeProviderRefreshable(providerBrick);

      if (providerBrick.interval && !this.refreshQueue.has(providerBrick)) {
        this.refreshQueue.set(providerBrick, { ...providerBrick.interval });
      }

      // Currently we can't refresh dynamic templates.
      if (type !== "reference" && !brickConf.template) {
        providerBrick.$$dependents.push({
          brick,
          method,
          args,
          field,
          ...(ref
            ? {
                ref,
                intermediateTransform: transform || name,
                intermediateTransformFrom: transformFrom,
                intermediateTransformMapArray: transformMapArray,
                transform: resolveConf.transform,
                transformFrom: resolveConf.transformFrom,
                transformMapArray: resolveConf.transformMapArray,
                onReject: resolveConf.onReject,
              }
            : {
                transform: transform || name,
                transformFrom,
                transformMapArray,
              }),
        });
      }
    }

    const cacheKey = JSON.stringify({
      provider,
      useProvider,
      method,
      args,
    });
    let promise: Promise<any>;
    if (this.cache.has(cacheKey)) {
      promise = this.cache.get(cacheKey);
    } else {
      let actualArgs = args
        ? ref
          ? args // `args` are already computed for `defineResolves`
          : context
          ? computeRealValue(args, context, true)
          : args
        : providerBrick.args || [];

      if (useProvider && isCustomApiProvider(useProvider)) {
        const allMicroAppApiOrchestrationMap = await this.kernel.getMicroAppApiOrchestrationMapAsync();
        actualArgs = getArgsOfCustomApi(
          useProvider,
          allMicroAppApiOrchestrationMap,
          actualArgs
        );
      }

      promise = providerBrick[method](...actualArgs);
      this.cache.set(cacheKey, promise);
    }

    let props: Record<string, any>;
    if (type === "reference") {
      props = propsReference;
    } else if (brickConf.template) {
      // It's a dynamic template.
      if (!brickConf.params) {
        // eslint-disable-next-line require-atomic-updates
        brickConf.params = {};
      }
      props = brickConf.params;
    } else {
      // It's a dynamic brick.
      props = brick.properties;
    }

    async function fetchData(): Promise<void> {
      const value = await promise;
      data = field === null || field === undefined ? value : get(value, field);
      // The fetched data and its inner objects should never be *injected* again.
      recursiveMarkAsInjected(data);
    }

    if (resolveConf.onReject) {
      // Transform as `onReject.transform` when provider failed.
      try {
        await fetchData();
      } catch (error) {
        if (isHandleRejectByTransform(resolveConf.onReject)) {
          transformProperties(
            props,
            error,
            context
              ? computeRealValue(resolveConf.onReject.transform, context, true)
              : resolveConf.onReject.transform
          );
        } else if (isHandleRejectByCatch(resolveConf.onReject)) {
          throw new ResolveRequestError(error);
        } else {
          throw error;
        }
      }
    } else {
      await fetchData();
    }

    if (ref) {
      data = transformIntermediateData(
        data,
        context ? computeRealValue(transform, context, true) : transform,
        transformFrom,
        transformMapArray
      );
    }

    transformProperties(
      props,
      data,
      // Also support legacy `name`
      context
        ? computeRealValue(
            resolveConf.transform || resolveConf.name,
            context,
            true
          )
        : resolveConf.transform || resolveConf.name,
      resolveConf.transformFrom,
      resolveConf.transformMapArray
    );
  }

  scheduleRefreshing(): void {
    for (const [providerBrick, interval] of this.refreshQueue.entries()) {
      const request = async (): Promise<void> => {
        await providerBrick.$refresh({
          ignoreErrors: interval.ignoreErrors,
          throwErrors: true,
        });
        if (this.active) {
          // eslint-disable-next-line require-atomic-updates
          interval.timeoutId = setTimeout(request, interval.delay);
        }
      };
      interval.timeoutId = setTimeout(request, interval.delay);
    }
  }
}

function isHandleRejectByTransform(
  onReject: HandleReject
): onReject is HandleRejectByTransform {
  return !!(onReject as HandleRejectByTransform).transform;
}

function isHandleRejectByCatch(
  onReject: HandleReject
): onReject is HandleRejectByCatch {
  return !!(onReject as HandleRejectByCatch).isolatedCrash;
}

export class ResolveRequestError extends Error {
  rawError: any;

  constructor(rawError: any) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(rawError.message);

    this.name = "ResolveRequestError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // istanbul ignore else
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResolveRequestError);
    }

    this.rawError = rawError;
  }
}
