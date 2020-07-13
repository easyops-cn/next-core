import { asyncProcessBrick } from "@easyops/brick-utils";
import { BrickConf } from "@easyops/brick-types";
import { brickTemplateRegistry } from "./core/TemplateRegistries";
import {
  LocationContext,
  mountTree,
  unmountTree,
  afterMountTree,
  _dev_only_getBrickPackages,
  _dev_only_getStoryboards,
} from "./core/exports";

export const developHelper = {
  asyncProcessBrick(brickConf: BrickConf): Promise<void> {
    return asyncProcessBrick(brickConf, brickTemplateRegistry, []);
  },
  LocationContext,
  mountTree,
  unmountTree,
  afterMountTree,
  getBrickPackages: _dev_only_getBrickPackages,
  getStoryboards: _dev_only_getStoryboards,
};
