import type { UseBrickSlotsConf, UseSingleBrickConf } from "@next-core/types";
import { isObject } from "@next-core/utils/general";
import type { TemplateHostContext } from "../interfaces.js";
import { setupTemplateProxy } from "./setupTemplateProxy.js";

export function setupUseBrickInTemplate<T>(
  props: T,
  hostContext: TemplateHostContext
): T {
  function walk<P>(props: P): P {
    if (!props) {
      return props;
    }

    if (Array.isArray(props)) {
      return props.map(walk) as P;
    }

    return Object.fromEntries(
      Object.entries(props)
        .map(([key, value]) =>
          isObject(value) && key === "useBrick"
            ? Array.isArray(value)
              ? [key, value.map(setup)]
              : [key, setup(value as UseSingleBrickConf)]
            : [key, value]
        )
        .concat(
          Object.getOwnPropertySymbols(props).map((k) => [
            k,
            (props as Record<string | symbol, unknown>)[k],
          ])
        )
    ) as P;
  }

  function setup(item: UseSingleBrickConf): UseSingleBrickConf {
    const slots = Object.fromEntries(
      Object.entries(item.slots ?? {}).map(([slotName, slotConf]) => [
        slotName,
        {
          type: "bricks",
          bricks: (slotConf.bricks ?? []).map(setup),
        },
      ])
    ) as UseBrickSlotsConf;

    return {
      ...item,
      properties: walk(item.properties),
      slots,
      ...setupTemplateProxy(hostContext, item.ref, slots),
    };
  }

  return walk(props);
}
