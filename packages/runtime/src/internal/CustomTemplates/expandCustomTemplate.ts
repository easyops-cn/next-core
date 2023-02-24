import type {
  BrickConf,
  BrickConfInTemplate,
  SlotsConfInTemplate,
  SlotsConfOfBricks,
  UseSingleBrickConf,
} from "@next-core/types";
import { uniq, uniqueId } from "lodash";
import { customTemplates } from "../../CustomTemplates.js";
import { DataStore } from "../data/DataStore.js";
import { RuntimeBrickConfWithTplSymbols } from "./constants.js";
import { setupTemplateProxy } from "./setupTemplateProxy.js";
import type {
  AsyncProperties,
  RuntimeBrick,
  TemplateHostBrick,
  TemplateHostContext,
} from "../interfaces.js";
import { setupUseBrickInTemplate } from "./setupUseBrickInTemplate.js";
import { childrenToSlots } from "../Renderer.js";
import { collectWidgetContract } from "../data/CollectContracts.js";

export function expandCustomTemplate<T extends BrickConf | UseSingleBrickConf>(
  tplTagName: string,
  brickConf: T,
  hostBrick: RuntimeBrick,
  asyncHostProperties: AsyncProperties | undefined
): T {
  const tplStateStoreId = uniqueId("tpl-state-");
  const runtimeContext = {
    ...hostBrick.runtimeContext,
    tplStateStoreId,
  };

  // There is a boundary for `forEachItem` between template internals and externals.
  delete runtimeContext.forEachItem;

  const tplStateStore = new DataStore("STATE", hostBrick);
  runtimeContext.tplStateStoreMap.set(tplStateStoreId, tplStateStore);

  const { bricks, proxy, state, contracts } = customTemplates.get(tplTagName)!;
  collectWidgetContract(contracts);
  tplStateStore.define(state, runtimeContext, asyncHostProperties);

  const {
    slots: originalExternalSlots,
    children: externalChildren,
    ...restBrickConf
  } = brickConf;

  const newBrickConf = {
    ...restBrickConf,
    brick: tplTagName,
  } as T;

  hostBrick.tplHostMetadata = {
    internalBricksByRef: new Map(),
    tplStateStoreId,
    proxy,
    // Allow duplicated state names which maybe mutually exclusive.
    exposedStates: state
      ? uniq(state.filter((item) => item.expose).map((item) => item.name))
      : [],
  };

  // Reversed proxies are used for expand storyboard before rendering page.
  const reversedProxies: TemplateHostContext["reversedProxies"] = {
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

  const hostContext: TemplateHostContext = {
    reversedProxies,
    asyncHostProperties,
    externalSlots: childrenToSlots(externalChildren, originalExternalSlots) as
      | SlotsConfOfBricks
      | undefined,
    tplStateStoreId,
    hostBrick: hostBrick as TemplateHostBrick,
  };

  newBrickConf.slots = {
    "": {
      type: "bricks",
      bricks: bricks.map((item) => expandBrickInTemplate(item, hostContext)),
    },
  };

  return newBrickConf;
}

function expandBrickInTemplate(
  brickConfInTemplate: BrickConfInTemplate,
  hostContext: TemplateHostContext
): RuntimeBrickConfWithTplSymbols {
  // Ignore `if: null` to make `looseCheckIf` working.
  if (brickConfInTemplate.if === null) {
    delete brickConfInTemplate.if;
  }
  const {
    ref,
    properties,
    slots: slotsInTemplate,
    children: childrenInTemplate,
    ...restBrickConfInTemplate
  } = brickConfInTemplate;

  const transpiledSlots = childrenToSlots(
    childrenInTemplate,
    slotsInTemplate
  ) as SlotsConfInTemplate | undefined;

  const slots: SlotsConfOfBricks = Object.fromEntries(
    Object.entries(transpiledSlots ?? {}).map(([slotName, slotConf]) => [
      slotName,
      {
        type: "bricks",
        bricks: (slotConf.bricks ?? []).map((item) =>
          expandBrickInTemplate(item, hostContext)
        ),
      },
    ])
  );

  return {
    ...restBrickConfInTemplate,
    properties: setupUseBrickInTemplate(properties, hostContext),
    slots,
    ...setupTemplateProxy(hostContext, ref, slots),
  };
}
