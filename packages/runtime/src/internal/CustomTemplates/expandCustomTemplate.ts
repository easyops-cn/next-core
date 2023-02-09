import type {
  BrickConf,
  BrickConfInTemplate,
  CustomTemplateProxyBasicProperty,
  CustomTemplateProxySlot,
  SlotsConfOfBricks,
} from "@next-core/brick-types";
import { uniqueId } from "lodash";
import { customTemplates } from "../../CustomTemplates.js";
import { DataStore } from "../data/DataStore.js";
import { RuntimeBrickConfWithTplSymbols } from "./constants.js";
import { setupTemplateProxy } from "./setupTemplateProxy.js";
import type {
  AsyncProperties,
  RuntimeBrick,
  RuntimeContext,
} from "../interfaces.js";

export interface ProxyContext {
  reversedProxies: ReversedProxies;
  asyncTemplateProperties?: AsyncProperties;
  externalSlots?: SlotsConfOfBricks;
  tplStateStoreId: string;
  proxyBrick: RuntimeBrick;
}

interface ReversedProxies {
  properties: Map<string, ReversedPropertyProxy[]>;
  slots: Map<string, ReversedSlotProxy[]>;
}

interface ReversedPropertyProxy {
  from: string;
  to: CustomTemplateProxyBasicProperty;
}

interface ReversedSlotProxy {
  from: string;
  to: CustomTemplateProxySlot;
}

export function expandCustomTemplate(
  tplTagName: string,
  brickConf: BrickConf,
  asyncTemplateProperties: AsyncProperties,
  proxyBrick: RuntimeBrick,
  _runtimeContext: RuntimeContext
): BrickConf {
  const tplStateStoreId = uniqueId("tpl-state-");
  const runtimeContext = {
    ..._runtimeContext,
    tplStateStoreId,
  };
  const tplStateStore = new DataStore("STATE", proxyBrick);
  runtimeContext.tplStateStoreMap.set(tplStateStoreId, tplStateStore);

  const { bricks, proxy, state } = customTemplates.get(tplTagName)!;
  // collectWidgetContract(template.contracts);
  tplStateStore.define(state, runtimeContext, asyncTemplateProperties);

  const { slots: externalSlots, ...restBrickConf } = brickConf;

  const newBrickConf: BrickConf = {
    ...restBrickConf,
    brick: tplTagName,
    properties: undefined,
  };

  proxyBrick.internalBricksByRef = new Map();
  proxyBrick.proxy = proxy;

  // Reversed proxies are used for expand storyboard before rendering page.
  const reversedProxies: ReversedProxies = {
    properties: new Map(),
    slots: new Map(),
    // mergeBases: new Map(),
  };

  if (proxy?.properties) {
    for (const [from, to] of Object.entries(proxy.properties)) {
      let proxies = reversedProxies.properties.get(to.ref);
      if (!proxies) {
        proxies = [];
        reversedProxies.properties.set(to.ref, proxies);
      }
      proxies.push({
        from,
        to,
      });
    }
  }

  if (proxy?.slots) {
    for (const [from, to] of Object.entries(proxy.slots)) {
      let proxies = reversedProxies.slots.get(to.ref);
      if (!proxies) {
        proxies = [];
        reversedProxies.slots.set(to.ref, proxies);
      }
      proxies.push({
        from,
        to,
      });
    }
  }

  const proxyContext: ProxyContext = {
    reversedProxies,
    asyncTemplateProperties,
    externalSlots: externalSlots as SlotsConfOfBricks | undefined,
    tplStateStoreId,
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

  // setupUseBrickInTemplate(brickConfInTemplate.properties, proxyContext);

  return {
    ...restBrickConfInTemplate,
    slots,
    ...setupTemplateProxy(proxyContext, ref, slots),
  };
}
