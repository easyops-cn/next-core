import { Location } from "history";
import { flushStableLoadBricks } from "@next-core/loader";
import { getHistory } from "./history.js";
import type { Kernel } from "./Kernel.js";
import { transpileRoutes } from "./Transpiler.js";

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
    const storyboard = this.#kernel.bootstrapData!.storyboards[0];
    // TODO: matchStoryboard()
    if (storyboard) {
      const output = await transpileRoutes(
        storyboard.routes,
        storyboard.app,
        this.#kernel.bootstrapData!.brickPackages
      );
      flushStableLoadBricks();
      await Promise.all(output.pendingPromises);
      const main = document.querySelector("#main-mount-point") as HTMLElement;
      for (const item of output.main) {
        const element = document.createElement(item.type as string);
        Object.assign(element, item.properties);
        main.appendChild(element);
      }
      // TODO: fulfilStoryboard()
      // TODO: getSubStoryboard()
      // TODO: loadDepsOfStoryboard()
      // TODO: registerCustomTemplates()
      // TODO: registerStoryboardFunctions()
      // TODO: mountRoutes()
    } else {
      alert("Storyboard not found");
    }
  }
}
