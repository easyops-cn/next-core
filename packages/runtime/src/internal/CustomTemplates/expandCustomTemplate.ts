import type {
  BrickConf,
  BrickConfInTemplate,
  SlotsConfInTemplate,
  SlotsConfOfBricks,
  UseSingleBrickConf,
} from "@next-core/types";
import { uniqueId } from "lodash";
import { customTemplates } from "../../CustomTemplates.js";
import { DataStore } from "../data/DataStore.js";
import { RuntimeBrickConfWithTplSymbols } from "./constants.js";
import { setupTemplateProxy } from "./setupTemplateProxy.js";
import type {
  AsyncPropertyEntry,
  RuntimeBrick,
  TemplateHostBrick,
  TemplateHostContext,
} from "../interfaces.js";
import { setupUseBrickInTemplate } from "./setupUseBrickInTemplate.js";
import { childrenToSlots } from "../Renderer.js";
import { hooks } from "../Runtime.js";
import type { RendererContext } from "../RendererContext.js";

export function expandCustomTemplate<T extends BrickConf | UseSingleBrickConf>(
  tplTagName: string,
  brickConf: T,
  hostBrick: RuntimeBrick,
  asyncHostPropertyEntries: AsyncPropertyEntry[],
  rendererContext: RendererContext
): T {
  const tplStateStoreId = uniqueId("tpl-state-");
  const runtimeContext = {
    ...hostBrick.runtimeContext,
    tplStateStoreId,
  };

  // There is a boundary for `forEach*` and `FORM_STATE` between template internals and externals.
  delete runtimeContext.forEachItem;
  delete runtimeContext.forEachIndex;
  delete runtimeContext.forEachSize;
  delete runtimeContext.formStateStoreId;

  const tplStateStore = new DataStore(
    "STATE",
    hostBrick,
    rendererContext,
    tplStateStoreId
  );
  runtimeContext.tplStateStoreMap.set(tplStateStoreId, tplStateStore);
  if (runtimeContext.tplStateStoreScope) {
    runtimeContext.tplStateStoreScope.push(tplStateStore);
  }

  const { bricks, proxy, state, contracts } = customTemplates.get(tplTagName)!;
  hooks?.flowApi?.collectWidgetContract(contracts);
  tplStateStore.define(state, runtimeContext, asyncHostPropertyEntries);

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
    asyncHostPropertyEntries,
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
    ...setupTemplateProxy(hostContext, restBrickConfInTemplate.ref, slots),
  };
}
