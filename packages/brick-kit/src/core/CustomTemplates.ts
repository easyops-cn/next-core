import { clamp } from "lodash";
import {
  TemplateRegistry,
  CustomTemplate,
  CustomTemplateConstructor,
  RuntimeBrickConf,
  BrickConfInTemplate,
  SlotsConfOfBricks,
  RefForProxy,
  CustomTemplateProxyProperty,
  CustomTemplateProxyTransformableProperty,
  CustomTemplateProxySlot,
  BrickConf,
  ProbablyRuntimeBrick,
  RuntimeBrickElement,
  CustomTemplateProxyBasicProperty,
  CustomTemplateProxyMergeableProperty,
  PluginRuntimeContext,
} from "@easyops/brick-types";
import { hasOwnProperty } from "@easyops/brick-utils";
import {
  transformElementProperties,
  preprocessTransformProperties,
} from "../transformProperties";
import { RuntimeBrick } from "./exports";
import { MergeBase, PropertyProxy } from "./internalInterfaces";
import {
  collectMergeBases,
  propertyMerge,
  propertyMergeAll,
} from "./propertyMerge";
import { collectRefsInTemplate } from "./collectRefsInTemplate";

const customTemplateRegistry: TemplateRegistry<CustomTemplate> = new Map();
const appRegistered = new Set<string>();

export const symbolForComputedPropsFromProxy = Symbol.for(
  "tpl.computedPropsFromProxy"
);
export const symbolForRefForProxy = Symbol.for("tpl.refForProxy");
export const symbolForParentTemplate = Symbol.for("tpl.parentTemplate");

export interface RuntimeBrickConfWithTplSymbols extends RuntimeBrickConf {
  [symbolForComputedPropsFromProxy]?: Record<string, any>;
  [symbolForRefForProxy]?: RefForProxy;
  [symbolForParentTemplate]?: ProbablyRuntimeBrick;
}

export interface RuntimeBrickElementWithTplSymbols extends RuntimeBrickElement {
  [symbolForParentTemplate]?: RuntimeBrickElementWithTplSymbols;
}

export function registerCustomTemplate(
  tplName: string,
  tplConstructor: CustomTemplateConstructor,
  appId?: string
): void {
  let tagName = tplName;
  // When a template is registered by an app, its namespace maybe missed.
  if (appId && !tplName.includes(".")) {
    tagName = `${appId}.${tplName}`;
  }
  if (customTemplateRegistry.has(tagName)) {
    // When open launchpad, the storyboard will be updated.
    // However, we can't *undefine* a custom element.
    // Just ignore re-registering custom templates.
    if (!appId || appRegistered.has(appId)) {
      // eslint-disable-next-line no-console
      console.error(`Custom template of "${tagName}" already registered.`);
    }
    return;
  }
  if (customElements.get(tagName)) {
    // eslint-disable-next-line no-console
    console.error(
      `Custom template of "${tagName}" already defined by customElements.`
    );
    return;
  }
  customTemplateRegistry.set(tagName, {
    ...tplConstructor,
    name: tagName,
  });

  // Collect defined properties of the template.
  const props = Object.keys(tplConstructor.proxy?.properties || {});

  const nativeProp = props.some((prop) => prop in HTMLElement.prototype);
  // istanbul ignore if
  if (nativeProp) {
    // eslint-disable-next-line no-console
    console.error(
      `In custom template "${tagName}", "${nativeProp}" is a native HTMLElement property, and should be avoid to be used as a brick property.`
    );
  }

  customElements.define(
    tagName,
    class TplElement extends HTMLElement {
      get $$typeof(): string {
        return "custom-template";
      }

      static get _dev_only_definedProperties(): string[] {
        return props;
      }

      connectedCallback(): void {
        // Don't override user's style settings.
        // istanbul ignore else
        if (!this.style.display) {
          this.style.display = "block";
        }
      }
    }
  );
  if (appId) {
    appRegistered.add(appId);
  }
}

// If it's a custom template, return the tag name of the template.
// Otherwise, return false.
export function getTagNameOfCustomTemplate(
  brick: string,
  appId?: string
): false | string {
  // When a template is registered by an app, it's namespace maybe missed.
  if (!brick.includes(".") && appId) {
    const tagName = `${appId}.${brick}`;
    if (customTemplateRegistry.has(tagName)) {
      return tagName;
    }
  }
  if (customTemplateRegistry.has(brick)) {
    return brick;
  }
  return false;
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

export function handleProxyOfCustomTemplate(brick: RuntimeBrick): void {
  if (!brick.proxyRefs) {
    return;
  }

  const node = brick.element as any;

  function getElementByRef(ref: string): HTMLElement {
    if (brick.proxyRefs.has(ref)) {
      return brick.proxyRefs.get(ref).brick?.element;
    }
  }

  // For usages of `targetRef: "..."`.
  // `tpl.$$getElementByRef(ref)` will return the ref element inside a custom template.
  Object.defineProperty(node, "$$getElementByRef", {
    value: getElementByRef,
  });

  if (!brick.proxy) {
    return;
  }

  const handleExtraOneWayRefs = (
    propName: string,
    propRef: CustomTemplateProxyProperty,
    value: any
  ): void => {
    if (Array.isArray(propRef.extraOneWayRefs)) {
      for (const extraRef of propRef.extraOneWayRefs) {
        const extraRefElement = getElementByRef(extraRef.ref) as any;
        // should always have refElement.
        // istanbul ignore else
        if (extraRefElement) {
          if (isTransformableProperty(extraRef)) {
            transformElementProperties(
              extraRefElement,
              {
                [propName]: value,
              },
              extraRef.refTransform
            );
          } else if (isMergeableProperty(extraRef)) {
            extraRefElement[extraRef.mergeProperty] = propertyMerge(
              extraRef,
              value,
              node
            );
          } else {
            extraRefElement[
              (extraRef as CustomTemplateProxyBasicProperty).refProperty
            ] = value;
          }
        }
      }
    }
  };

  const { properties, events, methods } = brick.proxy;
  if (properties) {
    for (const [propName, propRef] of Object.entries(properties)) {
      const refElement = getElementByRef(propRef.ref) as any;
      // should always have refElement.
      // istanbul ignore else
      if (refElement) {
        if (isTransformableProperty(propRef) || isMergeableProperty(propRef)) {
          // Create a non-enumerable symbol property to delegate the tpl root property.
          const delegatedPropSymbol = Symbol(`delegatedProp:${propName}`);
          node[delegatedPropSymbol] = node[propName];
          Object.defineProperty(node, propName, {
            get: function () {
              return node[delegatedPropSymbol];
            },
            set: function (value: unknown) {
              node[delegatedPropSymbol] = value;
              if (isTransformableProperty(propRef)) {
                transformElementProperties(
                  refElement,
                  {
                    [propName]: value,
                  },
                  propRef.refTransform
                );
              } else {
                refElement[propRef.mergeProperty] = propertyMerge(
                  propRef,
                  value,
                  node
                );
              }
              handleExtraOneWayRefs(propName, propRef, value);
            },
            enumerable: true,
          });
        } else {
          Object.defineProperty(node, propName, {
            get: function () {
              return refElement[propRef.refProperty];
            },
            set: function (value: unknown) {
              refElement[propRef.refProperty] = value;
              handleExtraOneWayRefs(propName, propRef, value);
            },
            enumerable: true,
          });
        }
      }
    }
  }

  if (events) {
    for (const [eventType, eventRef] of Object.entries(events)) {
      const refElement = getElementByRef(eventRef.ref);
      // should always have refElement.
      // istanbul ignore else
      if (refElement) {
        refElement.addEventListener(eventRef.refEvent, (e) => {
          if (e.bubbles) {
            e.stopPropagation();
          }
          node.dispatchEvent(
            new CustomEvent(eventType, {
              detail: (e as CustomEvent).detail,
              bubbles: e.bubbles,
              cancelable: e.cancelable,
              composed: e.composed,
            })
          );
        });
      }
    }
  }

  if (methods) {
    for (const [method, methodRef] of Object.entries(methods)) {
      const refElement = getElementByRef(methodRef.ref) as any;
      // should always have refElement.
      // istanbul ignore else
      if (refElement) {
        Object.defineProperty(node, method, {
          value: function (...args: any[]) {
            return refElement[methodRef.refMethod](...args);
          },
        });
      }
    }
  }
}

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

function isTransformableProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyTransformableProperty {
  return !!(propRef as CustomTemplateProxyTransformableProperty).refTransform;
}

function isMergeableProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyMergeableProperty {
  return !!(propRef as CustomTemplateProxyMergeableProperty).mergeProperty;
}
