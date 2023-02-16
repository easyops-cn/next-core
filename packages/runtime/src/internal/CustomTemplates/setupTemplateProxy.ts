import type { BrickConf, RouteConf, SlotsConfOfBricks } from "@next-core/types";
import { hasOwnProperty } from "@next-core/utils/general";
import { clamp } from "lodash";
import {
  symbolForAsyncComputedPropsFromHost,
  symbolForBrickHolder,
  symbolForTPlExternalForEachItem,
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
    asyncHostProperties,
    externalSlots,
    tplStateStoreId,
    hostBrick,
  } = hostContext;

  let asyncComputedProps: AsyncProperties | undefined;
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

      asyncComputedProps = (asyncHostProperties as AsyncProperties).then(
        getComputedProps
      );
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
        const refToSlot = to.refSlot ?? from;
        let expandableSlot = quasisMap.get(refToSlot);
        if (!expandableSlot) {
          expandableSlot = [];
          // The size of quasis should be the existed slotted bricks' size plus one.
          const size = hasOwnProperty(slots, refToSlot)
            ? slots[refToSlot].bricks.length + 1
            : 1;
          for (let i = 0; i < size; i += 1) {
            expandableSlot.push([]);
          }
          quasisMap.set(refToSlot, expandableSlot);
        }
        const refPosition = to.refPosition ?? -1;
        expandableSlot[
          clamp(
            refPosition < 0 ? expandableSlot.length + refPosition : refPosition,
            0,
            expandableSlot.length - 1
          )
        ].push(
          ...(hasOwnProperty(hostBrick.runtimeContext, "forEachItem")
            ? setupTemplateExternalBricks(
                insertBricks,
                hostBrick.runtimeContext.forEachItem
              )
            : insertBricks)
        );
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
    [symbolForBrickHolder]: brickHolder,
    [symbolForTplStateStoreId]: tplStateStoreId,
  };
}

// External bricks of a template, have the same forEachItem context as their host.
function setupTemplateExternalBricks(
  bricks: BrickConf[],
  forEachItem: unknown
): BrickConf[] {
  return bricks.map((brick) => ({
    ...brick,
    [symbolForTPlExternalForEachItem]: forEachItem,
    slots: Object.fromEntries(
      Object.entries(brick.slots ?? {}).map(([slotName, slotConf]) => [
        slotName,
        slotConf.type === "routes"
          ? {
              type: "routes",
              routes: setupTemplateExternalRoutes(slotConf.routes, forEachItem),
            }
          : {
              type: "bricks",
              bricks: setupTemplateExternalBricks(
                slotConf.bricks ?? [],
                forEachItem
              ),
            },
      ])
    ),
  }));
}

function setupTemplateExternalRoutes(
  routes: RouteConf[],
  forEachItem: unknown
): RouteConf[] {
  return routes.map((route) =>
    route.type && route.type !== "bricks"
      ? route
      : {
          ...route,
          bricks: setupTemplateExternalBricks(route.bricks, forEachItem),
        }
  );
}
