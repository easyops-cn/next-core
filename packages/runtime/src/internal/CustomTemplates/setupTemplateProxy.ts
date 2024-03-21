import type { BrickConf, RouteConf, SlotsConfOfBricks } from "@next-core/types";
import { hasOwnProperty } from "@next-core/utils/general";
import { clamp } from "lodash";
import {
  symbolForAsyncComputedPropsFromHost,
  symbolForTPlExternalForEachIndex,
  symbolForTPlExternalForEachItem,
  symbolForTPlExternalNoForEach,
  symbolForTplStateStoreId,
  type RuntimeBrickConfWithTplSymbols,
} from "./constants.js";
import type { AsyncPropertyEntry, TemplateHostContext } from "../interfaces.js";
import { computePropertyValue } from "../compute/computeRealProperties.js";
import { childrenToSlots } from "../Renderer.js";

export function setupTemplateProxy(
  hostContext: TemplateHostContext,
  ref: string | undefined,
  slots: SlotsConfOfBricks
) {
  const {
    reversedProxies,
    asyncHostPropertyEntries,
    externalSlots,
    tplStateStoreId,
    hostBrick,
  } = hostContext;

  let asyncComputedProps: AsyncPropertyEntry[] | undefined;

  if (ref && reversedProxies) {
    const propertyProxies = reversedProxies.properties.get(ref);
    if (propertyProxies) {
      const getComputedProps = (
        asyncHostProps: AsyncPropertyEntry[]
      ): AsyncPropertyEntry[] => {
        return propertyProxies!
          .map(({ from, to }) => {
            const filtered = asyncHostProps.filter(
              (entry) => entry[0] === from
            );
            if (filtered.length > 0 && to.refProperty) {
              return [
                to.refProperty,
                computePropertyValue(filtered, from),
                true,
              ];
            }
          })
          .filter(Boolean) as [string, Promise<unknown>][];
      };

      asyncComputedProps = getComputedProps(asyncHostPropertyEntries);
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
        // External bricks of a template, should not access the template internal forEach `ITEM`.
        // For some existing templates who is *USING* this bug, we keep the old behavior.
        const hostHasForEach = hasOwnProperty(
          hostBrick.runtimeContext,
          "forEachItem"
        );
        expandableSlot[
          clamp(
            refPosition < 0 ? expandableSlot.length + refPosition : refPosition,
            0,
            expandableSlot.length - 1
          )
        ].push(
          ...((hostContext.__temporary_tpl_tag_name ===
            "base-layout-v3.tpl-scroll-load-list" ||
            hostContext.__temporary_tpl_tag_name ===
              "shrcb-homepage.tpl-custom-scroll-load-list") &&
          !hostHasForEach
            ? insertBricks
            : setupTemplateExternalBricks(
                insertBricks,
                hostHasForEach,
                hostBrick.runtimeContext.forEachItem,
                hostBrick.runtimeContext.forEachIndex!
              ))
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
    [symbolForTplStateStoreId]: tplStateStoreId,
  };
}

// External bricks of a template, have the same forEachItem context as their host.
function setupTemplateExternalBricks(
  bricks: BrickConf[],
  hasForEach: boolean,
  forEachItem: unknown,
  forEachIndex: number
): BrickConf[] {
  return (bricks as RuntimeBrickConfWithTplSymbols[]).map(
    ({
      children,
      slots,
      [symbolForTPlExternalForEachItem]: a,
      [symbolForTPlExternalForEachIndex]: b,
      [symbolForTPlExternalNoForEach]: c,
      ...brick
    }) => ({
      ...brick,
      ...(hasForEach
        ? {
            [symbolForTPlExternalForEachItem]: forEachItem,
            [symbolForTPlExternalForEachIndex]: forEachIndex,
          }
        : {
            [symbolForTPlExternalNoForEach]: true,
          }),
      slots: Object.fromEntries(
        Object.entries(childrenToSlots(children, slots) ?? {}).map(
          ([slotName, slotConf]) => [
            slotName,
            slotConf.type === "routes"
              ? {
                  type: "routes",
                  routes: setupTemplateExternalRoutes(
                    slotConf.routes,
                    hasForEach,
                    forEachItem,
                    forEachIndex
                  ),
                }
              : {
                  type: "bricks",
                  bricks: setupTemplateExternalBricks(
                    slotConf.bricks ?? [],
                    hasForEach,
                    forEachItem,
                    forEachIndex
                  ),
                },
          ]
        )
      ),
    })
  );
}

function setupTemplateExternalRoutes(
  routes: RouteConf[],
  hasForEach: boolean,
  forEachItem: unknown,
  forEachIndex: number
): RouteConf[] {
  return routes.map((route) =>
    route.type && route.type !== "bricks"
      ? route
      : {
          ...route,
          bricks: setupTemplateExternalBricks(
            route.bricks,
            hasForEach,
            forEachItem,
            forEachIndex
          ),
        }
  );
}
