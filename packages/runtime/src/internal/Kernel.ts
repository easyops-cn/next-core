import { BootstrapData } from "@next-core/brick-types";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { loadBootstrapData } from "./loadBootstrapData.js";
import { Router } from "./Router.js";

export class Kernel {
  public bootstrapData: BootstrapData | undefined;

  #router: Router | undefined;

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
}
