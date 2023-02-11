import type { BrickConf, SlotsConfOfBricks } from "@next-core/brick-types";
import { hasOwnProperty } from "@next-core/utils/general";
import { clamp } from "lodash";
import {
  symbolForAsyncComputedPropsFromHost,
  symbolForBrickHolder,
  symbolForComputedPropsFromHost,
  symbolForTplStateStoreId,
} from "./constants.js";
import type {
  AsyncProperties,
  BrickHolder,
  TemplateHostContext,
} from "../interfaces.js";

export function setupTemplateProxy(
  hostContext: TemplateHostContext,
  ref: string | undefined,
  slots: SlotsConfOfBricks
) {
  const {
    reversedProxies,
    hostProperties,
    hostPropertiesAreAsync,
    externalSlots,
    tplStateStoreId,
    hostBrick: hostBrick,
  } = hostContext;

  let asyncComputedProps: AsyncProperties | undefined;
  let computedProps: Record<string, unknown> | undefined;
  let brickHolder: BrickHolder | undefined;

  if (ref && reversedProxies) {
    brickHolder = {};
    hostBrick.tplHostMetadata.internalBricksByRef.set(ref, brickHolder);

    const propertyProxies = reversedProxies.properties.get(ref);
    if (propertyProxies) {
      const getComputedProps = (hostProps: Record<string, unknown>) => {
        const props: Record<string, unknown> = {};
        for (const { from, to } of propertyProxies) {
          const propValue = hostProps[from];
          if (propValue !== undefined && to.refProperty) {
            props[to.refProperty] = propValue;
          }
        }
        return props;
      };
      if (hostPropertiesAreAsync) {
        asyncComputedProps = (hostProperties as AsyncProperties).then(
          getComputedProps
        );
      } else {
        computedProps = getComputedProps(
          hostProperties as Record<string, unknown>
        );
      }
    }

    const slotProxies = reversedProxies.slots.get(ref);
    if (slotProxies && externalSlots) {
      // Use an approach like template-literal's quasis:
      // `quasi0${0}quais1${1}quasi2...`
      // Every quasi (indexed by `refPosition`) can be slotted with multiple bricks.
      const quasisMap = new Map<string, BrickConf[][]>();

      for (const { from, to } of slotProxies) {
        const insertBricks = externalSlots[from]?.bricks ?? [];
        if (!insertBricks.length) {
          continue;
        }
        let expandableSlot = quasisMap.get(to.refSlot);
        if (!expandableSlot) {
          expandableSlot = [];
          // The size of quasis should be the existed slotted bricks' size plus one.
          const size = hasOwnProperty(slots, to.refSlot)
            ? slots[to.refSlot].bricks.length + 1
            : 1;
          for (let i = 0; i < size; i += 1) {
            expandableSlot.push([]);
          }
          quasisMap.set(to.refSlot, expandableSlot);
        }
        const refPosition = to.refPosition ?? -1;
        expandableSlot[
          clamp(
            refPosition < 0 ? expandableSlot.length + refPosition : refPosition,
            0,
            expandableSlot.length - 1
          )
        ].push(...insertBricks);
      }

      for (const [slotName, quasis] of quasisMap.entries()) {
        if (!hasOwnProperty(slots, slotName)) {
          slots[slotName] = {
            type: "bricks",
            bricks: [],
          };
        }
        const slotConf = slots[slotName];
        slotConf.bricks = quasis.flatMap((bricks, index) =>
          index < slotConf.bricks.length
            ? bricks.concat(slotConf.bricks[index])
            : bricks
        );

        if (slotConf.bricks.length === 0) {
          delete slots[slotName];
        }
      }
    }
  }

  return {
    [symbolForAsyncComputedPropsFromHost]: asyncComputedProps,
    [symbolForComputedPropsFromHost]: computedProps,
    [symbolForBrickHolder]: brickHolder,
    [symbolForTplStateStoreId]: tplStateStoreId,
  };
}
