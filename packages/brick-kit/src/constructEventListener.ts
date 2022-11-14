import { BrickEventHandler } from "@next-core/brick-types";
import { _internalApiGetCurrentContext } from "./core/exports";
import { listenerFactory } from "./internal/bindListeners";

export function constructEventListener(
  handler: BrickEventHandler
): EventListener {
  return listenerFactory(handler, _internalApiGetCurrentContext(), {
    element: null,
  });
}
