import type { BrickConf, RouteConf, SlotsConfOfBricks } from "@next-core/types";
import { hasOwnProperty } from "@next-core/utils/general";
import { clamp } from "lodash";
import {
  symbolForAsyncComputedPropsFromHost,
  symbolForTPlExternalForEachIndex,
  symbolForTPlExternalForEachItem,
  symbolForTPlExternalForEachSize,
  symbolForTplStateStoreId,
  type RuntimeBrickConfWithTplSymbols,
} from "./constants.js";
import type { AsyncPropertyEntry, TemplateHostContext } from "../interfaces.js";
import { computePropertyValue } from "../compute/computeRealProperties.js";
import { childrenToSlots } from "../Renderer.js";

export function setupTemplateProxy(
  hostContext: TemplateHostContext,
  ref: string | undefined,
  slots: SlotsConfOfBricks,
  slotted: boolean
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

    if (slotProxies && slotted) {
      throw new Error(
        `Can not have proxied slot ref when the ref target has a slot element child, check your template "${hostBrick.type}" and ref "${ref}"`
      );
    }

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
          ...(!hostHasForEach
            ? insertBricks
            : setupTemplateExternalBricksWithForEach(
                insertBricks,
                hostBrick.runtimeContext.forEachItem,
                hostBrick.runtimeContext.forEachIndex!,
                hostBrick.runtimeContext.forEachSize!
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
export function setupTemplateExternalBricksWithForEach(
  bricks: BrickConf[],
  forEachItem: unknown,
  forEachIndex: number,
  forEachSize: number
): BrickConf[] {
  return (bricks as RuntimeBrickConfWithTplSymbols[]).map(
    ({ children, slots, ...brick }) => ({
      ...brick,
      [symbolForTPlExternalForEachItem]: forEachItem,
      [symbolForTPlExternalForEachIndex]: forEachIndex,
      [symbolForTPlExternalForEachSize]: forEachSize,
      // Keep `:forEach` bricks as original, since they have their own forEachItem context.
      slots:
        brick.brick === ":forEach"
          ? childrenToSlots(children, slots)
          : Object.fromEntries(
              Object.entries(childrenToSlots(children, slots) ?? {}).map(
                ([slotName, slotConf]) => [
                  slotName,
                  slotConf.type === "routes"
                    ? {
                        type: "routes",
                        routes: setupTemplateExternalRoutesWithForEach(
                          slotConf.routes,
                          forEachItem,
                          forEachIndex,
                          forEachSize
                        ),
                      }
                    : {
                        type: "bricks",
                        bricks: setupTemplateExternalBricksWithForEach(
                          slotConf.bricks,
                          forEachItem,
                          forEachIndex,
                          forEachSize
                        ),
                      },
                ]
              )
            ),
    })
  );
}

function setupTemplateExternalRoutesWithForEach(
  routes: RouteConf[],
  forEachItem: unknown,
  forEachIndex: number,
  forEachSize: number
): RouteConf[] {
  return routes.map((route) =>
    route.type === "routes"
      ? {
          ...route,
          routes: setupTemplateExternalRoutesWithForEach(
            route.routes,
            forEachItem,
            forEachIndex,
            forEachSize
          ),
        }
      : route.type === "redirect"
        ? route
        : {
            ...route,
            bricks: setupTemplateExternalBricksWithForEach(
              route.bricks,
              forEachItem,
              forEachIndex,
              forEachSize
            ),
          }
  );
}
