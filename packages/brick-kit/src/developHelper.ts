import { asyncProcessBrick } from "@easyops/brick-utils";
import { BrickConf } from "@easyops/brick-types";
import { brickTemplateRegistry } from "./core/TemplateRegistries";
import {
  LocationContext,
  mountTree,
  unmountTree,
  _dev_only_getBrickPackages
} from "./core/exports";

export const developHelper = {
  asyncProcessBrick(brickConf: BrickConf): Promise<void> {
    return asyncProcessBrick(brickConf, brickTemplateRegistry, []);
  },
  LocationContext,
  mountTree,
  unmountTree,
  getBrickPackages: _dev_only_getBrickPackages
};
