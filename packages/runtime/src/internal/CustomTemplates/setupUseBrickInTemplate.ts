import type {
  UseBrickSlotConf,
  UseBrickSlotsConf,
  UseSingleBrickConf,
} from "@next-core/types";
import { isObject } from "@next-core/utils/general";
import type { TemplateHostContext } from "../interfaces.js";
import { setupTemplateProxy } from "./setupTemplateProxy.js";
import { childrenToSlots } from "../Renderer.js";
import { replaceSlotWithSlottedBricks } from "./replaceSlotWithSlottedBricks.js";

export function setupUseBrickInTemplate<T>(
  props: T,
  hostContext: TemplateHostContext
): T {
  function walk<P>(props: P): P {
    if (!isObject(props) || typeof props === "function") {
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
              ? [key, value.flatMap((v) => setup(v))]
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

  function setup(
    item: UseSingleBrickConf,
    markSlotted?: () => void
  ): UseSingleBrickConf | UseSingleBrickConf[] {
    if (item.brick === "slot") {
      markSlotted?.();
      return replaceSlotWithSlottedBricks(item, hostContext, (it) => setup(it));
    }

    const { properties, slots: originalSlots, children, ...restConf } = item;

    const transpiledSlots = childrenToSlots(children, originalSlots) as
      | UseBrickSlotsConf
      | undefined;

    let slotted = false;
    const markChild = () => {
      slotted = true;
    };
    const slots = Object.fromEntries<UseBrickSlotConf>(
      Object.entries(transpiledSlots ?? {}).map(([slotName, slotConf]) => [
        slotName,
        {
          type: "bricks",
          bricks: (slotConf.bricks ?? []).flatMap((it) => setup(it, markChild)),
        },
      ])
    );

    return {
      ...restConf,
      properties: walk(properties),
      slots,
      ...setupTemplateProxy(hostContext, restConf.ref, slots, slotted),
    };
  }

  return walk(props);
}
