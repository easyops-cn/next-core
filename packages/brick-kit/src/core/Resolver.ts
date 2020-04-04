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

export class Resolver {
  private readonly cache: Map<string, Promise<any>> = new Map();
  private refreshQueue: Map<RefreshableProvider, IntervalSettings> = new Map();
  private readonly definedResolves: Map<string, DefineResolveConf> = new Map();

  constructor(private kernel: Kernel) {}

  resetRefreshQueue(): void {
    if (this.refreshQueue.size > 0) {
      for (const interval of this.refreshQueue.values()) {
        clearTimeout(interval.timeoutId);
      }
      this.refreshQueue = new Map();
    }
  }

  defineResolves(resolves: DefineResolveConf[]): void {
    if (Array.isArray(resolves)) {
      for (const resolveConf of resolves) {
        this.definedResolves.set(resolveConf.id, resolveConf);
      }
    }
  }

  async resolve(
    brickConf: BrickConf,
    brick: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void> {
    const useResolves = brickConf.lifeCycle?.useResolves ?? [];
    await Promise.all(
      useResolves.map((resolveConf) =>
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
      await this.kernel.loadDynamicBricks(brickConf);
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
    conf: object,
    brick?: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void>;
  async resolveOne(
    type: "brick" | "reference",
    resolveConf: ResolveConf,
    conf: BrickConf | object,
    brick?: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void> {
    const brickConf = conf as BrickConf;
    const propsReference = conf as object;
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
      method = "resolve",
      args,
      field,
      transformFrom,
      transformMapArray,
      transform,
    } = actualResolveConf as EntityResolveConf;

    const providerBrick: RefreshableProvider = this.kernel.mountPoints.bg.querySelector(
      provider
    ) as RefreshableProvider;

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

    const cacheKey = JSON.stringify({
      provider,
      method,
      args,
    });
    let promise: Promise<any>;
    if (this.cache.has(cacheKey)) {
      promise = this.cache.get(cacheKey);
    } else {
      const actualArgs = args
        ? context
          ? computeRealValue(args, context, true)
          : args
        : providerBrick.args || [];

      const providerName = providerBrick.tagName.toLowerCase();
      if (!customElements.get(providerName)) {
        throw new Error(
          `Provider not defined: "${providerName}", make sure that relative package is installed`
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
    }

    if (resolveConf.onReject) {
      // Transform as `onReject.transform` when provider failed.
      try {
        await fetchData();
      } catch (error) {
        const onRejectTransform = (resolveConf.onReject as HandleRejectByTransform)
          .transform;
        if (onRejectTransform) {
          transformProperties(
            props,
            error,
            context
              ? computeRealValue(onRejectTransform, context, true)
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

    if (context?.flags?.["storyboard-debug-mode"]) {
      // eslint-disable-next-line no-console
      console.log(`Transform:`, props, data);
    }
  }

  scheduleRefreshing(): void {
    for (const [providerBrick, interval] of this.refreshQueue.entries()) {
      const request = async (): Promise<void> => {
        await providerBrick.$refresh({
          ignoreErrors: interval.ignoreErrors,
          throwErrors: true,
        });
        // eslint-disable-next-line require-atomic-updates
        interval.timeoutId = setTimeout(request, interval.delay);
      };
      interval.timeoutId = setTimeout(request, interval.delay);
    }
  }
}
