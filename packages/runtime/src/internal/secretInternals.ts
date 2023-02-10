import type { BrickEventHandler } from "@next-core/brick-types";
import { loadBricksImperatively } from "@next-core/loader";
import type { ElementHolder } from "./interfaces.js";
import { listenerFactory } from "./bindListeners.js";
import {
  _internalApiGetBrickPackages,
  _internalApiGetRuntimeContext,
} from "./Runtime.js";
import { computeRealProperties } from "./compute/computeRealProperties.js";
import { checkIf, IfContainer } from "./compute/checkIf.js";

export interface UseBrickContext {
  data: unknown;
  tplStateStoreId?: string;
}

export function listenerFactoryForUseBrick(
  handlers: BrickEventHandler | BrickEventHandler[],
  useBrickContext: UseBrickContext,
  elementHolder: ElementHolder
) {
  return listenerFactory(
    handlers,
    {
      ..._internalApiGetRuntimeContext()!,
      ...useBrickContext,
    },
    elementHolder
  );
}

export function computeRealPropertiesForUseBrick(
  properties: Record<string, unknown> | undefined,
  useBrickContext: UseBrickContext
): Record<string, unknown> | undefined {
  return computeRealProperties(properties, {
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
