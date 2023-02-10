import type {
  BrickEventHandler,
  BrickEventsMap,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import { loadBricksImperatively } from "@next-core/loader";
import type { RuntimeBrick } from "./interfaces.js";
import { bindListeners } from "./bindListeners.js";
import {
  _internalApiGetBrickPackages,
  _internalApiGetRuntimeContext,
} from "./Runtime.js";
import { computeRealProperties } from "./compute/computeRealProperties.js";
import { checkIf, IfContainer } from "./compute/checkIf.js";
import { getTagNameOfCustomTemplate } from "./CustomTemplates/utils.js";
import { expandCustomTemplate } from "./CustomTemplates/expandCustomTemplate.js";
import {
  RuntimeBrickConfOfTplSymbols,
  symbolForComputedProps,
  symbolForTplStateStoreId,
} from "./CustomTemplates/constants.js";

export interface UseBrickContext {
  data: unknown;
  tplStateStoreId?: string;
}

export function getUseBrickContext(
  useBrick: UseSingleBrickConf,
  data: unknown
): UseBrickContext {
  const ctx: UseBrickContext = { data };
  const tplStateStoreId = (useBrick as RuntimeBrickConfOfTplSymbols)[
    symbolForTplStateStoreId
  ];
  if (tplStateStoreId) {
    ctx.tplStateStoreId = tplStateStoreId;
  }
  return ctx;
}

export function bindListenersForUseBrick(
  brick: HTMLElement,
  eventsMap: BrickEventsMap | undefined,
  useBrickContext: UseBrickContext
) {
  return bindListeners(brick, eventsMap, {
    ..._internalApiGetRuntimeContext()!,
    ...useBrickContext,
  });
}

export function checkIfForUseBrick(
  ifContainer: IfContainer,
  useBrickContext: UseBrickContext
): boolean {
  return checkIf(ifContainer, {
    ..._internalApiGetRuntimeContext()!,
    ...useBrickContext,
  });
}

export function loadBricks(bricks: Iterable<string>) {
  return loadBricksImperatively(bricks, _internalApiGetBrickPackages());
}

export function getTplTagName(brick: string) {
  return getTagNameOfCustomTemplate(
    brick,
    _internalApiGetRuntimeContext()?.app.id
  );
}

export function expandCustomTemplateForUseBrick(
  tplTagName: string | false | undefined,
  useBrick: UseSingleBrickConf,
  useBrickContext: UseBrickContext
) {
  const runtimeContext = {
    ..._internalApiGetRuntimeContext()!,
    ...useBrickContext,
  };

  const computedProps = computeRealProperties(
    useBrick.properties,
    runtimeContext
  );
  const computedPropsFromHost = (useBrick as RuntimeBrickConfOfTplSymbols)[
    symbolForComputedProps
  ];
  if (computedPropsFromHost) {
    for (const [propName, propValue] of Object.entries(computedPropsFromHost)) {
      computedProps[propName] = propValue;
    }
  }

  const runtimeBrick: RuntimeBrick = {
    type: tplTagName || useBrick.brick,
    children: [],
    runtimeContext,
  };

  let expandedUseBrick: UseSingleBrickConf = {
    ...useBrick,
    properties: computedProps,
  };

  if (tplTagName) {
    expandedUseBrick = expandCustomTemplate(
      tplTagName,
      expandedUseBrick,
      runtimeBrick,
      computedProps
    );
  }

  return {
    expandedUseBrick,
    runtimeBrick,
  };
}

export { handleProxyOfCustomTemplate } from "./CustomTemplates/handleProxyOfCustomTemplate.js";
