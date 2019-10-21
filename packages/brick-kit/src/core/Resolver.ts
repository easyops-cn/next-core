import { get } from "lodash";
import {
  BrickConf,
  ResolveConf,
  PluginRuntimeContext
} from "@easyops/brick-types";
import {
  computeRealValue,
  asyncProcessBrick,
  scanBricksInBrickConf,
  getDllAndDepsOfBricks,
  loadScript
} from "@easyops/brick-utils";
import { Kernel, RuntimeBrick } from "./exports";
import {
  makeProviderRefreshable,
  RefreshableProvider,
  IntervalSettings
} from "../makeProviderRefreshable";
import { brickTemplateRegistry } from "./TemplateRegistries";

export class Resolver {
  private cache: Map<string, Promise<any>> = new Map();
  private refreshQueue: Map<RefreshableProvider, IntervalSettings> = new Map();

  constructor(private kernel: Kernel) {}

  resetRefreshQueue(): void {
    if (this.refreshQueue.size > 0) {
      for (const interval of this.refreshQueue.values()) {
        clearTimeout(interval.timeoutId);
      }
      this.refreshQueue = new Map();
    }
  }

  async resolve(
    brickConf: BrickConf,
    brick: RuntimeBrick,
    context: PluginRuntimeContext
  ): Promise<void> {
    const useResolves = get(
      brickConf,
      ["lifeCycle", "useResolves"],
      [] as ResolveConf[]
    );
    await Promise.all(
      useResolves.map(async resolveConf => {
        const { name, provider, method = "resolve", args, field } = resolveConf;
        const providerBrick: any = this.kernel.mountPoints.bg.querySelector(
          provider
        ) as any;
        if (providerBrick) {
          makeProviderRefreshable(providerBrick);

          if (providerBrick.interval && !this.refreshQueue.has(providerBrick)) {
            this.refreshQueue.set(providerBrick, { ...providerBrick.interval });
          }

          const actualArgs = args
            ? computeRealValue(args, context, true)
            : providerBrick.args || [];

          // Currently we can't refresh dynamic templates.
          if (!brickConf.template) {
            providerBrick.$$dependents.push({
              brick,
              name,
              method,
              actualArgs,
              field
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
            promise = providerBrick[method](...actualArgs);
            this.cache.set(cacheKey, promise);
          }

          const value = await promise;
          const fieldValue =
            field === null || field === undefined ? value : get(value, field);

          if (brickConf.template) {
            // It's a dynamic template.
            if (!brickConf.params) {
              // eslint-disable-next-line require-atomic-updates
              brickConf.params = {};
            }
            // eslint-disable-next-line require-atomic-updates
            brickConf.params[name] = fieldValue;

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
          } else {
            // It's a dynamic brick.
            // eslint-disable-next-line require-atomic-updates
            brick.properties[name] = fieldValue;
          }
        } else {
          throw new Error(
            `Provider not found: "${provider}" in ${
              brickConf.template
                ? `template ${brickConf.template}`
                : `brick ${brick.type}`
            }`
          );
        }
      })
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
