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
} from "@easyops/brick-types";
import { hasOwnProperty } from "@easyops/brick-utils";
import { transformProperties } from "../transformProperties";
import { setRealProperties } from "../setProperties";
import { RuntimeBrick } from "./exports";

const customTemplateRegistry: TemplateRegistry<CustomTemplate> = new Map();
const appRegistered = new Set<string>();

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
  customElements.define(
    tagName,
    class TplElement extends HTMLElement {
      get $$typeof(): string {
        return "custom-template";
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
  proxyBrick: RuntimeBrick
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

  const reversedProxies: ReversedProxies = {
    properties: new Map(),
    slots: new Map(),
  };
  const reversedEntries: ReversedEntries[] = ["properties", "slots"];
  for (const entry of reversedEntries) {
    if (proxy?.[entry]) {
      for (const [reversedRef, conf] of Object.entries(proxy[entry])) {
        let proxies: any[];
        if (reversedProxies[entry].has(conf.ref)) {
          proxies = reversedProxies[entry].get(conf.ref);
        } else {
          proxies = [];
          reversedProxies[entry].set(conf.ref, proxies);
        }
        proxies.push({
          ...conf,
          reversedRef,
        });
      }
    }
  }

  const proxyContext: ProxyContext = {
    reversedProxies,
    templateProperties,
    templateSlots: templateSlots as SlotsConfOfBricks,
    proxyRefs: proxyBrick.proxyRefs,
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
): RuntimeBrickConf {
  const {
    ref,
    slots: slotsInTemplate,
    ...restBrickConfInTemplate
  } = brickConfInTemplate;
  const {
    reversedProxies,
    templateProperties,
    templateSlots,
    proxyRefs,
  } = proxyContext;
  let $$computedPropsFromProxy: Record<string, any>;
  let $$refForProxy: RefForProxy;

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
    $$refForProxy = {};
    proxyRefs.set(ref, $$refForProxy);

    if (reversedProxies.properties.has(ref)) {
      $$computedPropsFromProxy = Object.fromEntries(
        reversedProxies.properties
          .get(ref)
          .flatMap((item) => {
            const propValue = templateProperties?.[item.reversedRef];
            if (isTransformableProperty(item)) {
              return Object.entries(
                transformProperties(
                  {},
                  {
                    [item.reversedRef]: propValue,
                  },
                  item.refTransform
                )
              );
            }
            return [[item.refProperty, propValue]];
          })
          .filter((item) => item[1] !== undefined)
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
            refPosition < 0
              ? expandableSlot.length + refPosition + 1
              : refPosition,
            0,
            expandableSlot.length - 1
          )
        ].push(...(templateSlots?.[item.reversedRef]?.bricks ?? []));
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
    $$computedPropsFromProxy,
    $$refForProxy,
  };
}

export function handleProxyOfCustomTemplate(brick: RuntimeBrick): void {
  if (!brick.proxy || !brick.proxyRefs) {
    return;
  }

  const node = brick.element as any;
  const { properties, events, methods } = brick.proxy;

  // For usages of `targetRef: "..."`.
  // `tpl.$$getElementByRef(ref)` will return the ref element inside a custom template.
  Object.defineProperty(node, "$$getElementByRef", {
    value: (ref: string): HTMLElement => {
      return brick.proxyRefs.get(ref)?.brick?.element;
    },
  });

  if (properties) {
    for (const [propName, propRef] of Object.entries(properties)) {
      if (brick.proxyRefs.has(propRef.ref)) {
        const refElement = brick.proxyRefs.get(propRef.ref).brick
          ?.element as any;
        // should always have refElement.
        // istanbul ignore else
        if (refElement) {
          if (isTransformableProperty(propRef)) {
            // Create a non-enumerable symbol property to delegate the tpl root property.
            const delegatedPropSymbol = Symbol(`delegatedProp:${propName}`);
            node[delegatedPropSymbol] = node[propName];
            Object.defineProperty(node, propName, {
              get: function () {
                return node[delegatedPropSymbol];
              },
              set: function (value: any) {
                node[delegatedPropSymbol] = value;
                setRealProperties(
                  refElement,
                  transformProperties(
                    {},
                    {
                      [propName]: value,
                    },
                    propRef.refTransform
                  )
                );
              },
              enumerable: true,
            });
          } else {
            Object.defineProperty(node, propName, {
              get: function () {
                return refElement[propRef.refProperty];
              },
              set: function (value: any) {
                refElement[propRef.refProperty] = value;
              },
              enumerable: true,
            });
          }
        }
      }
    }
  }

  if (events) {
    for (const [eventType, eventRef] of Object.entries(events)) {
      if (brick.proxyRefs.has(eventRef.ref)) {
        const refElement = brick.proxyRefs.get(eventRef.ref).brick?.element;
        // should always have refElement.
        // istanbul ignore else
        if (refElement) {
          refElement.addEventListener(eventRef.refEvent, (e) => {
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
  }

  if (methods) {
    for (const [method, methodRef] of Object.entries(methods)) {
      if (brick.proxyRefs.has(methodRef.ref)) {
        const refElement = brick.proxyRefs.get(methodRef.ref).brick
          ?.element as any;
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
}

interface ProxyContext {
  reversedProxies: ReversedProxies;
  templateProperties: Record<string, any>;
  templateSlots: SlotsConfOfBricks;
  proxyRefs: Map<string, any>;
}

interface ReversedProxies {
  properties: Map<string, PropertyProxy[]>;
  slots: Map<string, SlotProxy[]>;
}

type ReversedEntries = keyof ReversedProxies;

type PropertyProxy = CustomTemplateProxyProperty & {
  reversedRef: string;
};

interface SlotProxy extends CustomTemplateProxySlot {
  reversedRef: string;
}

function isTransformableProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyTransformableProperty {
  return !!(propRef as CustomTemplateProxyTransformableProperty).refTransform;
}
