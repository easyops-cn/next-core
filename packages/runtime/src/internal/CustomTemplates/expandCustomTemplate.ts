import type {
  BrickConf,
  BrickConfInTemplate,
  SlotsConfOfBricks,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import { uniq, uniqueId } from "lodash";
import { customTemplates } from "../../CustomTemplates.js";
import { DataStore } from "../data/DataStore.js";
import { RuntimeBrickConfWithTplSymbols } from "./constants.js";
import { setupTemplateProxy } from "./setupTemplateProxy.js";
import type {
  MaybeAsyncProperties,
  RuntimeBrick,
  TemplateHostBrick,
  TemplateHostContext,
} from "../interfaces.js";
import { setupUseBrickInTemplate } from "./setupUseBrickInTemplate.js";

export function expandCustomTemplate<T extends BrickConf | UseSingleBrickConf>(
  tplTagName: string,
  brickConf: T,
  hostBrick: RuntimeBrick,
  hostProperties: MaybeAsyncProperties | undefined,
  hostPropertiesAreAsync?: boolean
): T {
  const tplStateStoreId = uniqueId("tpl-state-");
  const runtimeContext = {
    ...hostBrick.runtimeContext,
    tplStateStoreId,
  };
  const tplStateStore = new DataStore("STATE", hostBrick);
  runtimeContext.tplStateStoreMap.set(tplStateStoreId, tplStateStore);

  const { bricks, proxy, state } = customTemplates.get(tplTagName)!;
  // collectWidgetContract(template.contracts);
  tplStateStore.define(
    state,
    runtimeContext,
    hostProperties,
    hostPropertiesAreAsync
  );

  const { slots: externalSlots, ...restBrickConf } = brickConf;

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
    hostProperties,
    hostPropertiesAreAsync,
    externalSlots: externalSlots as SlotsConfOfBricks | undefined,
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
    slots: slotsInTemplate,
    ...restBrickConfInTemplate
  } = brickConfInTemplate;

  const slots: SlotsConfOfBricks = Object.fromEntries(
    Object.entries(slotsInTemplate ?? {}).map(([slotName, slotConf]) => [
      slotName,
      {
        type: "bricks",
        bricks: (slotConf.bricks ?? []).map((item) =>
          expandBrickInTemplate(item, hostContext)
        ),
      },
    ])
  );

  setupUseBrickInTemplate(brickConfInTemplate.properties, hostContext);

  return {
    ...restBrickConfInTemplate,
    slots,
    ...setupTemplateProxy(hostContext, ref, slots),
  };
}
