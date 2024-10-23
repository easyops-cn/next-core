import { clamp } from "lodash";
import { hasOwnProperty } from "@next-core/brick-utils";
import type {
  BrickConf,
  RefForProxy,
  SlotsConfOfBricks,
} from "@next-core/brick-types";
import type { ProxyContext } from "./expandCustomTemplate";
import { preprocessTransformProperties } from "../../transformProperties";
import { isBasicProperty, isTransformableProperty } from "./assertions";
import {
  RuntimeBrickConfOfTplSymbols,
  symbolForComputedPropsFromProxy,
  symbolForRefForProxy,
  symbolForTplContextId,
} from "./constants";
import { propertyMergeAll } from "./propertyMerge";

export function setupTemplateProxy(
  proxyContext: Partial<ProxyContext>,
  ref: string,
  slots: SlotsConfOfBricks,
  slotted?: boolean
): RuntimeBrickConfOfTplSymbols {
  const computedPropsFromProxy: Record<string, unknown> = {};
  let refForProxy: RefForProxy;

  const {
    reversedProxies,
    templateProperties,
    externalSlots,
    templateContextId,
    proxyBrick,
  } = proxyContext;

  if (ref && reversedProxies) {
    refForProxy = {};
    proxyBrick.proxyRefs.set(ref, refForProxy);

    // Reversed proxies are used for expand storyboard before rendering page.
    if (reversedProxies.properties.has(ref)) {
      Object.assign(
        computedPropsFromProxy,
        Object.fromEntries(
          reversedProxies.properties
            .get(ref)
            .flatMap((propRef) => {
              // `propValue` is computed.
              const propValue = templateProperties?.[propRef.$$reversedRef];
              if (isTransformableProperty(propRef)) {
                return Object.entries(
                  preprocessTransformProperties(
                    {
                      [propRef.$$reversedRef]: propValue,
                    },
                    propRef.refTransform
                  )
                );
              }
              if (isBasicProperty(propRef)) {
                return [[propRef.refProperty, propValue]];
              }
              // Ignore Variable properties.
              // And mergeable properties are processed later.
              return [];
            })
            .filter((propRef) => propRef[1] !== undefined)
        )
      );

      // Brick properties can be merged multiple times.
      if (reversedProxies.mergeBases.has(ref)) {
        Object.assign(
          computedPropsFromProxy,
          Object.fromEntries(
            Array.from(reversedProxies.mergeBases.get(ref).entries())
              .map(([mergeProperty, mergeBase]) => [
                mergeProperty,
                propertyMergeAll(mergeBase, templateProperties ?? {}),
              ])
              .filter((item) => item[1] !== undefined)
          )
        );
      }
    }

    // Use an approach like template-literal's quasis:
    // `quasi0${0}quais1${1}quasi2...`
    // Every quasi (indexed by `refPosition`) can be slotted with multiple bricks.
    const quasisMap = new Map<string, BrickConf[][]>();

    if (reversedProxies.slots.has(ref)) {
      if (slotted) {
        throw new Error(
          `Can not have proxied slot ref when the ref target has a slot element child, check your template "${proxyBrick.type}" and ref "${ref}"`
        );
      }

      for (const item of reversedProxies.slots.get(ref)) {
        if (!quasisMap.has(item.refSlot)) {
          const quasis: BrickConf[][] = [];
          // The size of quasis should be the existed slotted bricks' size plus one.
          const size = hasOwnProperty(slots, item.refSlot)
            ? slots[item.refSlot].bricks.length + 1
            : 1;
          for (let i = 0; i < size; i += 1) {
            quasis.push([]);
          }
          quasisMap.set(item.refSlot, quasis);
        }
        const expandableSlot = quasisMap.get(item.refSlot);
        const refPosition = item.refPosition ?? -1;
        expandableSlot[
          clamp(
            refPosition < 0 ? expandableSlot.length + refPosition : refPosition,
            0,
            expandableSlot.length - 1
          )
        ].push(...(externalSlots?.[item.$$reversedRef]?.bricks ?? []));
      }
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

  return {
    [symbolForComputedPropsFromProxy]: computedPropsFromProxy,
    [symbolForRefForProxy]: refForProxy,
    [symbolForTplContextId]: templateContextId,
  };
}
