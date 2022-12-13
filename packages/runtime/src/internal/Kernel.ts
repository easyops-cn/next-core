import { http } from "@next-core/brick-http";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { loadMicroApps } from "./loadMicroApps.js";

export class Kernel {
  async bootstrap(): Promise<void> {
    await Promise.all([loadCheckLogin(), loadMicroApps()]);
  }
}
