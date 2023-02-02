import { Location } from "history";
import { flushStableLoadBricks } from "@next-core/loader";
import { getHistory } from "./history.js";
import type { Kernel } from "./Kernel.js";
import { transpileRoutes } from "./Transpiler.js";
import { RuntimeContext } from "./RuntimeContext.js";
import { DataStore } from "./DataStore.js";
import { clearResolveCache } from "./resolveData.js";
import { mountTree, unmountTree } from "./mount.js";
import { matchStoryboard } from "./matchStoryboard.js";

export class Router {
  #rendering = false;
  #nextLocation: Location | undefined;

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
        this.#nextLocation = undefined;
        await this.#queuedRender(nextLocation);
      }
    }
  }

  async #render(location: Location): Promise<void> {
    clearResolveCache();
    const storyboard = matchStoryboard(
      this.#kernel.bootstrapData.storyboards,
      location.pathname
    );
    if (storyboard) {
      const runtimeContext: RuntimeContext = {
        app: storyboard.app,
        location,
        query: new URLSearchParams(location.search),
        ctxStore: new DataStore("CTX"),
        brickPackages: this.#kernel.bootstrapData.brickPackages,
      };
      const output = await transpileRoutes(storyboard.routes, runtimeContext);

      if (output.redirect) {
        getHistory().replace(output.redirect.path, output.redirect.state);
        return;
      }

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
