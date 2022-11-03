import { uniq } from "lodash";
import {
  BrickConfInTemplate,
  CustomTemplateProxySlot,
  PluginRuntimeContext,
  RuntimeBrickConf,
  SlotsConfOfBricks,
  CustomTemplate,
} from "@next-core/brick-types";
import { RuntimeBrick } from "../BrickNode";
import {
  MergeBase,
  PropertyProxy,
  RuntimeCustomTemplateProxy,
  RuntimeCustomTemplateProxyProperties,
} from "./internalInterfaces";
import { isMergeableProperty, isVariableProperty } from "./assertions";
import { collectRefsInTemplate } from "./collectRefsInTemplate";
import {
  customTemplateRegistry,
  RuntimeBrickConfWithTplSymbols,
} from "./constants";
import { collectMergeBases } from "./collectMergeBases";
import { CustomTemplateContext } from "./CustomTemplateContext";
import { setupUseBrickInTemplate } from "./setupUseBrickInTemplate";
import { setupTemplateProxy } from "./setupTemplateProxy";
import { collectWidgetContract } from "../CollectContracts";

export interface ProxyContext {
  reversedProxies: ReversedProxies;
  templateProperties: Record<string, unknown>;
  externalSlots: SlotsConfOfBricks;
  templateContextId: string;
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
  const tplContext = new CustomTemplateContext(proxyBrick);
  const template = customTemplateRegistry.get(brickConf.brick);
  if (template.contracts) {
    collectWidgetContract(template.contracts);
  }
  if (Array.isArray(template.state)) {
    tplContext.state.syncDefine(template.state, context, proxyBrick);
  }
  return lowLevelExpandCustomTemplate(
    template,
    brickConf,
    proxyBrick,
    context,
    tplContext
  );
}

export async function asyncExpandCustomTemplate(
  brickConf: RuntimeBrickConf,
  proxyBrick: RuntimeBrick,
  context: PluginRuntimeContext
): Promise<RuntimeBrickConf> {
  const tplContext = new CustomTemplateContext(proxyBrick);
  const template = customTemplateRegistry.get(brickConf.brick);
  if (template.contracts) {
    collectWidgetContract(template.contracts);
  }
  if (Array.isArray(template.state)) {
    await tplContext.state.define(template.state, context, proxyBrick);
  }
  return lowLevelExpandCustomTemplate(
    template,
    brickConf,
    proxyBrick,
    context,
    tplContext
  );
}

function lowLevelExpandCustomTemplate(
  template: CustomTemplate,
  brickConf: RuntimeBrickConf,
  proxyBrick: RuntimeBrick,
  context: PluginRuntimeContext,
  tplContext: CustomTemplateContext
): RuntimeBrickConf {
  const { bricks, proxy, state } = template;
  const {
    properties: templateProperties,
    slots: externalSlots,
    ...restBrickConf
  } = brickConf;
  const newBrickConf = restBrickConf as RuntimeBrickConf;

  // Get a copy of proxy for each instance of custom template.
  const proxyCopy: RuntimeCustomTemplateProxy = {
    ...proxy,
  };
  proxyBrick.proxy = proxyCopy;
  proxyBrick.proxyRefs = new Map();
  // Allow duplicated state names which maybe mutually exclusive.
  proxyBrick.stateNames = state
    ? uniq(state.map((item) => item.name))
    : undefined;

  const refToBrickConf = collectRefsInTemplate(template);

  // Reversed proxies are used for expand storyboard before rendering page.
  const reversedProxies: ReversedProxies = {
    properties: new Map(),
    slots: new Map(),
    mergeBases: new Map(),
  };

  const tplVariables: Record<string, unknown> = {};

  if (proxy?.properties) {
    const refPropertiesCopy = {} as RuntimeCustomTemplateProxyProperties;
    proxyCopy.$$properties = refPropertiesCopy;

    for (const [reversedRef, conf] of Object.entries(proxy.properties)) {
      if (isVariableProperty(conf)) {
        tplVariables[reversedRef] = templateProperties?.[reversedRef];
      } else {
        // Variable property proxies have no refs.
        refPropertiesCopy[reversedRef] = {
          ...conf,
          extraOneWayRefs: Array.isArray(conf.extraOneWayRefs)
            ? conf.extraOneWayRefs.map((extraConf) => ({ ...extraConf }))
            : undefined,
        };
      }
    }

    tplContext.setVariables(tplVariables);

    const reversedProperties = reversedProxies.properties;
    for (const [reversedRef, conf] of Object.entries(refPropertiesCopy)) {
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
          {
            ...context,
            tplContextId: tplContext.id,
          },
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
    externalSlots: externalSlots as SlotsConfOfBricks,
    templateContextId: tplContext.id,
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

  setupUseBrickInTemplate(brickConfInTemplate.properties, proxyContext);

  return {
    ...restBrickConfInTemplate,
    slots,
    ...setupTemplateProxy(proxyContext, ref, slots),
  };
}
