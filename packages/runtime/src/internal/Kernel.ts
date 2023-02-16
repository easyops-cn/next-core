import { BootstrapData } from "@next-core/types";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { loadBootstrapData } from "./loadBootstrapData.js";
import { Router } from "./Router.js";

export class Kernel {
  public bootstrapData!: BootstrapData;

  public readonly router = new Router(this);

  async bootstrap(): Promise<void> {
    const [, bootstrapData] = await Promise.all([
      loadCheckLogin(),
      loadBootstrapData(),
    ]);
    this.bootstrapData = bootstrapData;
    await this.router.bootstrap();
    document.body.classList.add("first-rendered");
  }
}
