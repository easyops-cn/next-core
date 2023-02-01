import { Location } from "history";
import { flushStableLoadBricks } from "@next-core/loader";
import { getHistory } from "./history.js";
import type { Kernel } from "./Kernel.js";
import { transpileRoutes } from "./Transpiler.js";
import { RuntimeContext } from "./RuntimeContext.js";
import { DataStore } from "./DataStore.js";
import { clearResolveCache } from "./resolveData.js";
import { mountTree, unmountTree } from "./mount.js";

export class Router {
  #rendering = false;
  #nextLocation: Location | null = null;

  #kernel: Kernel;

  constructor(kernel: Kernel) {
    this.#kernel = kernel;
  }

  bootstrap() {
    const history = getHistory();
    history.listen((location, action) => {
      if (this.#rendering) {
        this.#nextLocation = location;
      } else {
        this.#queuedRender(location).catch((e) => {
          // eslint-disable-next-line no-console
          console.error("Route failed:");
          throw e;
        });
      }
    });
    return this.#queuedRender(history.location);
  }

  async #queuedRender(location: Location): Promise<void> {
    this.#rendering = true;
    try {
      await this.#render(location);
    } finally {
      this.#rendering = false;
      if (this.#nextLocation) {
        const nextLocation = this.#nextLocation;
        this.#nextLocation = null;
        await this.#queuedRender(nextLocation);
      }
    }
  }

  async #render(location: Location): Promise<void> {
    clearResolveCache();
    const storyboard = this.#kernel.bootstrapData!.storyboards[0];
    // TODO: matchStoryboard()
    if (storyboard) {
      const runtimeContext: RuntimeContext = {
        ctxStore: new DataStore("CTX"),
        app: storyboard.app,
        brickPackages: this.#kernel.bootstrapData!.brickPackages,
      };
      const output = await transpileRoutes(storyboard.routes, runtimeContext);
      flushStableLoadBricks();
      await Promise.all(output.pendingPromises);

      const main = document.querySelector("#main-mount-point") as HTMLElement;
      const portal = document.querySelector(
        "#portal-mount-point"
      ) as HTMLElement;

      // Unmount main tree to avoid app change fired before new routes mounted.
      unmountTree(main);
      unmountTree(portal);

      mountTree(output.main, main);
      mountTree(output.portal, portal);
    } else {
      alert("Storyboard not found");
    }
  }
}
