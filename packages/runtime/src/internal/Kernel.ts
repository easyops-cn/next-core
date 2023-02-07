import { BootstrapData } from "@next-core/brick-types";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { loadBootstrapData } from "./loadBootstrapData.js";
import { Router } from "./Router.js";

export class Kernel {
  public bootstrapData!: BootstrapData;

  #router!: Router;

  async bootstrap(): Promise<void> {
    const [, bootstrapData] = await Promise.all([
      loadCheckLogin(),
      loadBootstrapData(),
    ]);
    this.bootstrapData = bootstrapData;
    this.#router = new Router(this);
    await this.#router.bootstrap();
    document.body.classList.add("first-rendered");
  }

  getRenderId() {
    return this.#router.getRenderId();
  }
}
