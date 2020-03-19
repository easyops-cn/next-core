import {
  TemplateRegistry,
  CustomTemplate,
  CustomTemplateConstructor,
  RuntimeBrickConf,
  BrickConfInTemplate,
  SlotsConfOfBricks,
  RefForProxy,
  CustomTemplateProxyProperty,
  CustomTemplateProxySlot
} from "@easyops/brick-types";
import { hasOwnProperty } from "@easyops/brick-utils";
import { RuntimeBrick } from "./BrickNode";

const customTemplateRegistry: TemplateRegistry<CustomTemplate> = new Map();
const appRegistered = new Set<string>();

export function registerCustomTemplate(
  tplName: string,
  tplConstructor: CustomTemplateConstructor,
  appId?: string
): void {
  if (customTemplateRegistry.has(tplName)) {
    // When open launchpad, the storyboard will be updated.
    // However, we can't *undefine* a custom element.
    // Just ignore re-registering custom templates.
    if (!appId || appRegistered.has(appId)) {
      // eslint-disable-next-line no-console
      console.error(`Custom template of "${tplName}" already registered.`);
    }
    return;
  }
  if (customElements.get(tplName)) {
    // eslint-disable-next-line no-console
    console.error(
      `Custom template of "${tplName}" already defined by customElements.`
    );
    return;
  }
  if (appId) {
    const splitTplName = tplName.split(".");
    if (
      splitTplName.length !== 2 ||
      splitTplName[0] !== appId ||
      !/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(splitTplName[1])
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `Custom template in a storyboard should in a form of "your-app-id.your-tpl-name". Received: "${tplName}" in app "${appId}".`
      );
    }
  }
  customTemplateRegistry.set(tplName, {
    ...tplConstructor,
    name: tplName
  });
  customElements.define(
    tplName,
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

export function isCustomTemplate(brick: string): boolean {
  return customTemplateRegistry.has(brick);
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
    slots: new Map()
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
          reversedRef
        });
      }
    }
  }

  const proxyContext: ProxyContext = {
    reversedProxies,
    templateProperties,
    templateSlots: templateSlots as SlotsConfOfBricks,
    proxyRefs: proxyBrick.proxyRefs
  };

  newBrickConf.slots = {
    "": {
      type: "bricks",
      bricks: bricks.map(item => expandBrickInTemplate(item, proxyContext))
    }
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
    proxyRefs
  } = proxyContext;
  let $$computedPropsFromProxy: Record<string, any>;
  let $$refForProxy: RefForProxy;

  const slots: SlotsConfOfBricks = Object.fromEntries(
    Object.entries(slotsInTemplate ?? {}).map(([slotName, slotConf]) => [
      slotName,
      {
        type: "bricks",
        bricks: (slotConf.bricks ?? []).map(item =>
          expandBrickInTemplate(item, proxyContext)
        )
      }
    ])
  );

  if (ref) {
    $$refForProxy = {};
    proxyRefs.set(ref, $$refForProxy);

    if (reversedProxies.properties.has(ref)) {
      $$computedPropsFromProxy = Object.fromEntries(
        reversedProxies.properties
          .get(ref)
          .map(item => [
            item.refProperty,
            templateProperties?.[item.reversedRef]
          ])
          .filter(item => item[1] !== undefined)
      );
    }

    if (reversedProxies.slots.has(ref)) {
      for (const item of reversedProxies.slots.get(ref)) {
        if (!hasOwnProperty(slots, item.refSlot)) {
          slots[item.refSlot] = {
            type: "bricks",
            bricks: []
          };
        }
        const slotConf = slots[item.refSlot];
        const refPosition = item.refPosition ?? -1;
        slotConf.bricks.splice(
          refPosition < 0
            ? slotConf.bricks.length + refPosition + 1
            : refPosition,
          0,
          ...(templateSlots?.[item.reversedRef]?.bricks ?? [])
        );
      }
    }
  }

  return {
    ...restBrickConfInTemplate,
    slots,
    $$computedPropsFromProxy,
    $$refForProxy
  };
}

export function handleProxyOfCustomTemplate(brick: RuntimeBrick): void {
  if (!brick.proxy || !brick.proxyRefs) {
    return;
  }

  const node = brick.element;
  const { properties, events, methods } = brick.proxy;

  if (properties) {
    for (const [propName, propRef] of Object.entries(properties)) {
      if (brick.proxyRefs.has(propRef.ref)) {
        const refElement = brick.proxyRefs.get(propRef.ref).brick
          ?.element as any;
        // should always have refElement.
        // istanbul ignore else
        if (refElement) {
          Object.defineProperty(node, propName, {
            get: function() {
              return refElement[propRef.refProperty];
            },
            set: function(value: any) {
              refElement[propRef.refProperty] = value;
            }
          });
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
          refElement.addEventListener(eventRef.refEvent, e => {
            node.dispatchEvent(
              new CustomEvent(eventType, {
                detail: (e as CustomEvent).detail,
                bubbles: e.bubbles,
                cancelable: e.cancelable,
                composed: e.composed
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
            value: function(...args: any[]) {
              return refElement[methodRef.refMethod](...args);
            }
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

interface PropertyProxy extends CustomTemplateProxyProperty {
  reversedRef: string;
}

interface SlotProxy extends CustomTemplateProxySlot {
  reversedRef: string;
}
