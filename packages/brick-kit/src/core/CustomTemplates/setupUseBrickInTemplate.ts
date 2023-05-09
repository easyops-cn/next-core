import {
  SlotsConfOfBricks,
  UseBrickSlotsConf,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import { isObject } from "@next-core/brick-utils";
import type { ProxyContext } from "./expandCustomTemplate";
import { setupTemplateProxy } from "./setupTemplateProxy";

export function setupUseBrickInTemplate<T>(
  props: T,
  proxyContext: Partial<ProxyContext>
): T {
  function walk<P>(props: P): P {
    if (Array.isArray(props)) {
      return props.map(walk) as P & any[];
    }

    if (!isObject(props) || !isPlainObject(props)) {
      return props;
    }

    return Object.fromEntries(
      Object.entries(props)
        .map(([key, value]) =>
          isObject(value) && key === "useBrick"
            ? Array.isArray(value)
              ? [key, value.map(setup)]
              : [key, setup(value as UseSingleBrickConf)]
            : [key, walk(value)]
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
    const { properties, slots: originalSlots, ...restConf } = item;

    const slots = Object.fromEntries(
      Object.entries(originalSlots ?? {}).map(([slotName, slotConf]) => [
        slotName,
        {
          type: "bricks",
          bricks: (slotConf.bricks ?? []).map(setup),
        },
      ])
    ) as UseBrickSlotsConf;

    return {
      ...restConf,
      properties: walk(properties),
      slots,
      ...setupTemplateProxy(
        proxyContext,
        restConf.ref,
        slots as SlotsConfOfBricks
      ),
    };
  }

  return walk(props);
}

function isPlainObject(object: unknown): boolean {
  return Object.prototype.toString.call(object) === "[object Object]";
}
