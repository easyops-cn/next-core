import { UseBrickConf, UseSingleBrickConf } from "@next-core/brick-types";
import { isObject } from "@next-core/brick-utils";
import {
  symbolForTplContextId,
  RuntimeBrickConfWithTplSymbols,
} from "./constants";

export function setupUseBrickInTemplate(
  props: unknown,
  tplContextId: string
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
  function setup(item: UseSingleBrickConf): void {
    (item as RuntimeBrickConfWithTplSymbols)[symbolForTplContextId] =
      tplContextId;
    walk(item.properties);
    if (item.slots) {
      Object.values(item.slots).forEach((slot) => {
        if (Array.isArray(slot.bricks)) {
          slot.bricks.forEach(setup);
        }
      });
    }
  }
  walk(props);
}
