import { processBrick } from "@easyops/brick-utils";
import { BrickConf } from "@easyops/brick-types";
import { brickTemplateRegistry } from "./core/TemplateRegistries";

export const developHelper = {
  processBrick(brickConf: BrickConf): void {
    processBrick(brickConf, brickTemplateRegistry);
  }
};
