import { processBrick, asyncProcessBrick } from "@easyops/brick-utils";
import { BrickConf } from "@easyops/brick-types";
import { brickTemplateRegistry } from "./core/TemplateRegistries";
import { LocationContext, mountTree, unmountTree } from "./core/exports";

export const developHelper = {
  // Deprecated.
  processBrick(brickConf: BrickConf): void {
    processBrick(brickConf, brickTemplateRegistry);
  },
  asyncProcessBrick(brickConf: BrickConf): Promise<void> {
    return asyncProcessBrick(brickConf, brickTemplateRegistry, []);
  },
  LocationContext,
  mountTree,
  unmountTree
};
