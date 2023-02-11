import {
  SlotsConfOfBricks,
  UseBrickConf,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import { isObject } from "@next-core/utils/general";
import { TemplateHostContext } from "../interfaces.js";
// import type { ProxyContext } from "./expandCustomTemplate.js";
import { setupTemplateProxy } from "./setupTemplateProxy.js";

export function setupUseBrickInTemplate(
  props: unknown,
  hostContext: TemplateHostContext
): void {
  function walk(props: unknown): void {
    if (!props) {
      return;
    }
    for (const [key, value] of Object.entries<UseBrickConf>(
      props as Record<string, UseBrickConf>
    )) {
      if (isObject(value)) {
        if (key === "useBrick") {
          if (Array.isArray(value)) {
            value.forEach(setup);
          } else {
            setup(value);
          }
        } else {
          walk(value);
        }
      }
    }
  }

  function setup(item: UseSingleBrickConf): UseSingleBrickConf {
    const { ref, slots: slotsInTemplate } = item;

    item.slots = Object.fromEntries(
      Object.entries(slotsInTemplate ?? {}).map(([slotName, slotConf]) => [
        slotName,
        {
          type: "bricks",
          bricks: (slotConf.bricks ?? []).map(setup),
        },
      ])
    );

    Object.assign(
      item,
      setupTemplateProxy(hostContext, ref, item.slots as SlotsConfOfBricks)
    );

    walk(item.properties);

    return item;
  }

  walk(props);
}
