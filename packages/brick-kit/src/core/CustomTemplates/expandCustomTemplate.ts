import {
  BrickConf,
  BrickConfInTemplate,
  CustomTemplateProxySlot,
  PluginRuntimeContext,
  RefForProxy,
  RuntimeBrickConf,
  SlotsConfOfBricks,
} from "@easyops/brick-types";
import { hasOwnProperty } from "@easyops/brick-utils";
import { clamp } from "lodash";
import { preprocessTransformProperties } from "../../transformProperties";
import { RuntimeBrick } from "../BrickNode";
import { MergeBase, PropertyProxy } from "../internalInterfaces";
import { isMergeableProperty, isTransformableProperty } from "./assertions";
import { collectRefsInTemplate } from "./collectRefsInTemplate";
import {
  customTemplateRegistry,
  RuntimeBrickConfWithTplSymbols,
  symbolForComputedPropsFromProxy,
  symbolForParentTemplate,
  symbolForRefForProxy,
} from "./constants";
import { collectMergeBases, propertyMergeAll } from "./propertyMerge";

interface ProxyContext {
  reversedProxies: ReversedProxies;
  templateProperties: Record<string, any>;
  templateSlots: SlotsConfOfBricks;
  proxyBrick: RuntimeBrick;
}

interface ReversedProxies {
  properties: Map<string, PropertyProxy[]>;
  slots: Map<string, SlotProxy[]>;
  mergeBases: Map<string, Map<string, MergeBase>>;
}

interface SlotProxy extends CustomTemplateProxySlot {
  $$reversedRef?: string;
}

export function expandCustomTemplate(
  brickConf: RuntimeBrickConf,
  proxyBrick: RuntimeBrick,
  context: PluginRuntimeContext
): RuntimeBrickConf {
  const template = customTemplateRegistry.get(brickConf.brick);
  const { bricks, proxy } = template;
  const {
    properties: templateProperties,
    slots: templateSlots,
    ...restBrickConf
  } = brickConf;
  const newBrickConf = restBrickConf as RuntimeBrickConf;

  proxyBrick.proxy = proxy;
  proxyBrick.proxyRefs = new Map();

  const refToBrickConf = collectRefsInTemplate(template);

  // Reversed proxies are used for expand storyboard before rendering page.
  const reversedProxies: ReversedProxies = {
    properties: new Map(),
    slots: new Map(),
    mergeBases: new Map(),
  };

  if (proxy?.properties) {
    const reversedProperties = reversedProxies.properties;

    for (const [reversedRef, conf] of Object.entries<PropertyProxy>(
      proxy.properties
    )) {
      let proxies: PropertyProxy[];
      if (reversedProperties.has(conf.ref)) {
        proxies = reversedProperties.get(conf.ref);
      } else {
        proxies = [];
        reversedProperties.set(conf.ref, proxies);
      }
      conf.$$reversedRef = reversedRef;

      if (isMergeableProperty(conf)) {
        collectMergeBases(
          conf,
          reversedProxies.mergeBases,
          context,
          refToBrickConf
        );
      }

      proxies.push(conf);

      // Properties may have extra refs.
      if (Array.isArray(conf.extraOneWayRefs)) {
        for (const extraRef of conf.extraOneWayRefs) {
          let extraProxies: PropertyProxy[];
          if (reversedProperties.has(extraRef.ref)) {
            extraProxies = reversedProperties.get(extraRef.ref);
          } else {
            extraProxies = [];
            reversedProperties.set(extraRef.ref, extraProxies);
          }
          (extraRef as PropertyProxy).$$reversedRef = reversedRef;
          extraProxies.push(extraRef);
        }
      }
    }
  }

  if (proxy?.slots) {
    const reveredSlots = reversedProxies.slots;
    for (const [reversedRef, conf] of Object.entries<SlotProxy>(proxy.slots)) {
      let proxies: SlotProxy[];
      if (reveredSlots.has(conf.ref)) {
        proxies = reveredSlots.get(conf.ref);
      } else {
        proxies = [];
        reveredSlots.set(conf.ref, proxies);
      }
      conf.$$reversedRef = reversedRef;
      proxies.push(conf);
    }
  }

  const proxyContext: ProxyContext = {
    reversedProxies,
    templateProperties,
    templateSlots: templateSlots as SlotsConfOfBricks,
    proxyBrick,
  };

  newBrickConf.slots = {
    "": {
      type: "bricks",
      bricks: bricks.map((item) => expandBrickInTemplate(item, proxyContext)),
    },
  };

  return newBrickConf;
}

function expandBrickInTemplate(
  brickConfInTemplate: BrickConfInTemplate,
  proxyContext: ProxyContext
): RuntimeBrickConfWithTplSymbols {
  // Ignore `if: null` to make `looseCheckIf` working.
  if (brickConfInTemplate.if === null) {
    delete brickConfInTemplate.if;
  }
  const {
    ref,
    slots: slotsInTemplate,
    ...restBrickConfInTemplate
  } = brickConfInTemplate;
  const {
    reversedProxies,
    templateProperties,
    templateSlots,
    proxyBrick: { proxyRefs },
  } = proxyContext;
  const computedPropsFromProxy: Record<string, any> = {};
  let refForProxy: RefForProxy;
  let parentTemplate: RuntimeBrick;

  if (restBrickConfInTemplate.bg || restBrickConfInTemplate.portal) {
    parentTemplate = proxyContext.proxyBrick;
  }

  const slots: SlotsConfOfBricks = Object.fromEntries(
    Object.entries(slotsInTemplate ?? {}).map(([slotName, slotConf]) => [
      slotName,
      {
        type: "bricks",
        bricks: (slotConf.bricks ?? []).map((item) =>
          expandBrickInTemplate(item, proxyContext)
        ),
      },
    ])
  );

  if (ref) {
    refForProxy = {};
    proxyRefs.set(ref, refForProxy);

    // Reversed proxies are used for expand storyboard before rendering page.
    if (reversedProxies.properties.has(ref)) {
      Object.assign(
        computedPropsFromProxy,
        Object.fromEntries(
          reversedProxies.properties
            .get(ref)
            .flatMap((item) => {
              // `propValue` is computed.
              const propValue = templateProperties?.[item.$$reversedRef];
              if (isTransformableProperty(item)) {
                return Object.entries(
                  preprocessTransformProperties(
                    {
                      [item.$$reversedRef]: propValue,
                    },
                    item.refTransform
                  )
                );
              }
              if (isMergeableProperty(item)) {
                // Mergeable properties are processed later.
                return [];
              }
              return [[item.refProperty, propValue]];
            })
            .filter((item) => item[1] !== undefined)
        )
      );
    }

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

    // Use an approach like template-literal's quasis:
    // `quasi0${0}quais1${1}quasi2...`
    // Every quasi (indexed by `refPosition`) can be slotted with multiple bricks.
    const quasisMap = new Map<string, BrickConf[][]>();

    if (reversedProxies.slots.has(ref)) {
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
        ].push(...(templateSlots?.[item.$$reversedRef]?.bricks ?? []));
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
    ...restBrickConfInTemplate,
    slots,
    [symbolForComputedPropsFromProxy]: computedPropsFromProxy,
    [symbolForRefForProxy]: refForProxy,
    [symbolForParentTemplate]: parentTemplate,
  };
}
