import { Location } from "history";
import { getHistory } from "./history.js";

export class Router {
  private rendering = false;
  private nextLocation: Location | null = null;

  constructor() {
    const history = getHistory();
    history.listen((location, action) => {
      if (this.rendering) {
        this.nextLocation = location;
      } else {
        this.queuedRender(location).catch((e) => {
          // eslint-disable-next-line no-console
          console.error("Route failed:");
          throw e;
        });
      }
    });
  }

  private async queuedRender(location: Location): Promise<void> {
    this.rendering = true;
    try {
      await this.render(location);
    } finally {
      this.rendering = false;
      if (this.nextLocation) {
        const nextLocation = this.nextLocation;
        this.nextLocation = null;
        await this.queuedRender(nextLocation);
      }
    }
  }

  private async render(location: Location): Promise<void> {
    let storyboard: any;
    // TODO: matchStoryboard()
    if (storyboard) {
      // TODO: fulfilStoryboard()
      // TODO: getSubStoryboard()
      // TODO: loadDepsOfStoryboard()
      // TODO: registerCustomTemplates()
      // TODO: registerStoryboardFunctions()
      // TODO: mountRoutes()
    }
  }
}
