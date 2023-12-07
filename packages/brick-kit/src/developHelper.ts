import { noop } from "lodash";
import { asyncProcessBrick } from "@next-core/brick-utils";
import { BrickConf } from "@next-core/brick-types";
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
  _dev_only_getContextValue,
  _dev_only_getAllContextValues,
  _dev_only_getFakeKernel,
  _dev_only_loadEditorBricks,
  _dev_only_updateStoryboard,
  _dev_only_updateTemplatePreviewSettings,
  _dev_only_updateSnippetPreviewSettings,
  _dev_only_updateFormPreviewSettings,
  _dev_only_updateStoryboardByRoute,
  _dev_only_updateStoryboardByTemplate,
  _dev_only_updateStoryboardBySnippet,
  _dev_only_getAddedContracts,
  _dev_only_render,
} from "./core/exports";
import {
  addRealTimeDataInspectHook,
  setRealTimeDataInspectRoot,
} from "./core/realTimeDataInspect";

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
  getTemplatePackages: _dev_only_getTemplatePackages,
  getStoryboards: _dev_only_getStoryboards,
  loadEditorBricks: _dev_only_loadEditorBricks,
  loadDynamicBricksInBrickConf: _dev_only_loadDynamicBricksInBrickConf,
  getFakeKernel: _dev_only_getFakeKernel,
  /** @deprecated Keep it for backward-compatibility. */
  checkoutTplContext: noop,
  updateStoryboard: _dev_only_updateStoryboard,
  updateStoryboardByRoute: _dev_only_updateStoryboardByRoute,
  updateStoryboardByTemplate: _dev_only_updateStoryboardByTemplate,
  updateStoryboardBySnippet: _dev_only_updateStoryboardBySnippet,
  updateTemplatePreviewSettings: _dev_only_updateTemplatePreviewSettings,
  updateSnippetPreviewSettings: _dev_only_updateSnippetPreviewSettings,
  updateFormPreviewSettings: _dev_only_updateFormPreviewSettings,
  getAddedContracts: _dev_only_getAddedContracts,
  getContextValue: _dev_only_getContextValue,
  getAllContextValues: _dev_only_getAllContextValues,
  render: _dev_only_render,
  setRealTimeDataInspectRoot,
  addRealTimeDataInspectHook,
};
