import { get } from "lodash";
import {
  BrickConf,
  PluginRuntimeContext,
  RuntimeBrickConf,
  RefResolveConf,
  EntityResolveConf,
  DefineResolveConf,
  ResolveConf
} from "@easyops/brick-types";
import {
  computeRealValue,
  asyncProcessBrick,
  scanBricksInBrickConf,
  getDllAndDepsOfBricks,
  loadScript,
  transformProperties,
  transformIntermediateData
} from "@easyops/brick-utils";
import { Kernel, RuntimeBrick } from "./exports";
import {
  makeProviderRefreshable,
  RefreshableProvider,
  IntervalSettings
} from "../makeProviderRefreshable";
import { brickTemplateRegistry } from "./TemplateRegistries";
import { RedirectConf } from "./interfaces";

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
      useResolves.map(resolveConf =>
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
      const brickCollection = new Set<string>();
      scanBricksInBrickConf(brickConf, brickCollection);
      const { dll, deps } = getDllAndDepsOfBricks(
        Array.from(brickCollection).filter(
          // Only try to load undefined custom elements.
          element => element.includes("-") && !customElements.get(element)
        ),
        this.kernel.bootstrapData.brickPackages
      );
      await loadScript(dll);
      await loadScript(deps);
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
    type: "redirect",
    resolveConf: ResolveConf,
    conf: RedirectConf,
    brick?: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void>;
  async resolveOne(
    type: "brick" | "redirect",
    resolveConf: ResolveConf,
    conf: BrickConf | RedirectConf,
    brick?: RuntimeBrick,
    context?: PluginRuntimeContext
  ): Promise<void> {
    const brickConf = conf as BrickConf;
    const redirectConf = conf as RedirectConf;
    let actualResolveConf: EntityResolveConf;
    const { ref } = resolveConf as RefResolveConf;
    if (ref) {
      if (!this.definedResolves.has(ref)) {
        throw new Error(
          `Provider ref not found: "${ref}" in ${
            type === "redirect"
              ? "redirect"
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
      transform
    } = actualResolveConf as EntityResolveConf;

    const providerBrick: RefreshableProvider = this.kernel.mountPoints.bg.querySelector(
      provider
    ) as RefreshableProvider;

    if (!providerBrick) {
      throw new Error(
        `Provider not found: "${provider}" in ${
          type === "redirect"
            ? "redirect"
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
    if (type !== "redirect" && !brickConf.template) {
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
              transform: resolveConf.transform,
              transformFrom: resolveConf.transformFrom
            }
          : {
              transform: transform || name,
              transformFrom
            })
      });
    }

    const cacheKey = JSON.stringify({
      provider,
      method,
      args
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

    const value = await promise;
    data = field === null || field === undefined ? value : get(value, field);

    if (ref) {
      data = transformIntermediateData(data, transform, transformFrom);
    }

    let props: Record<string, any>;
    if (type === "redirect") {
      props = redirectConf;
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
    transformProperties(
      props,
      data,
      // Also support legacy `name`
      resolveConf.transform || resolveConf.name,
      resolveConf.transformFrom
    );
  }

  scheduleRefreshing(): void {
    for (const [providerBrick, interval] of this.refreshQueue.entries()) {
      const request = async (): Promise<void> => {
        await providerBrick.$refresh({
          ignoreErrors: interval.ignoreErrors,
          throwErrors: true
        });
        // eslint-disable-next-line require-atomic-updates
        interval.timeoutId = setTimeout(request, interval.delay);
      };
      interval.timeoutId = setTimeout(request, interval.delay);
    }
  }
}
