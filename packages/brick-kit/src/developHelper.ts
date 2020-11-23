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
  _dev_only_loadDynamicBricksInBrickConf,
  _dev_only_getTemplatePackages,
  _dev_only_getFakeKernel,
} from "./core/exports";

/** @internal */
export const developHelper = {
  asyncProcessBrick(brickConf: BrickConf): Promise<void> {
    return asyncProcessBrick(
      brickConf,
      brickTemplateRegistry,
      _dev_only_getTemplatePackages()
    );
  },
  LocationContext,
  mountTree,
  unmountTree,
  afterMountTree,
  getBrickPackages: _dev_only_getBrickPackages,
  getStoryboards: _dev_only_getStoryboards,
  loadDynamicBricksInBrickConf: _dev_only_loadDynamicBricksInBrickConf,
  getFakeKernel: _dev_only_getFakeKernel,
};
