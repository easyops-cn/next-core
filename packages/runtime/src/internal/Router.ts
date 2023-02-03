import { Location } from "history";
import { flushStableLoadBricks } from "@next-core/loader";
import { getHistory } from "./history.js";
import type { Kernel } from "./Kernel.js";
import { transpileRoutes } from "./Transpiler.js";
import { DataStore } from "./data/DataStore.js";
import { clearResolveCache } from "./data/resolveData.js";
import { mountTree, unmountTree } from "./mount.js";
import { matchStoryboard } from "./matchStoryboard.js";
import { customTemplates } from "../CustomTemplates.js";
import { registerStoryboardFunctions } from "./compute/StoryboardFunctions.js";
import { RuntimeContext } from "@next-core/brick-types";
import { preCheckPermissions } from "./checkPermissions.js";

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
        pendingPermissionsPreCheck: [preCheckPermissions(storyboard)],
      };

      if (!storyboard.$$registerCustomTemplateProcessed) {
        const templates = storyboard.meta?.customTemplates;
        if (Array.isArray(templates)) {
          for (const tpl of templates) {
            const tagName = tpl.name.includes(".")
              ? tpl.name
              : `${storyboard.app.id}.${tpl.name}`;
            customTemplates.define(tagName, tpl);
          }
        }
        storyboard.$$registerCustomTemplateProcessed = true;
      }

      registerStoryboardFunctions(storyboard.meta?.functions, storyboard.app);

      const output = await transpileRoutes(storyboard.routes, runtimeContext);

      if (output.redirect) {
        getHistory().replace(output.redirect.path, output.redirect.state);
        return;
      }

      flushStableLoadBricks();
      await Promise.all(output.blockingList);

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
