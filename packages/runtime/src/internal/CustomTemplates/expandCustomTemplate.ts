import type {
  BrickConf,
  BrickConfInTemplate,
  SlotConfOfBricks,
  SlotsConfInTemplate,
  SlotsConfOfBricks,
  UseSingleBrickConf,
} from "@next-core/types";
import { uniqueId } from "lodash";
import { customTemplates } from "../../CustomTemplates.js";
import { DataStore } from "../data/DataStore.js";
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
import { replaceSlotWithSlottedBricks } from "./replaceSlotWithSlottedBricks.js";
import { isolatedTemplateRegistryMap } from "../IsolatedTemplates.js";

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

  const { bricks, proxy, state, contracts } = hostBrick.runtimeContext
    .isolatedRoot
    ? isolatedTemplateRegistryMap
        .get(hostBrick.runtimeContext.isolatedRoot)!
        .get(tplTagName)!
    : customTemplates.get(tplTagName)!;
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
    usedSlots: new Set(),
  };

  newBrickConf.slots = {
    "": {
      type: "bricks",
      bricks: bricks.flatMap((item) =>
        expandBrickInTemplate(item, hostContext)
      ),
    },
  };

  return newBrickConf;
}

function expandBrickInTemplate(
  brickConfInTemplate: BrickConf,
  hostContext: TemplateHostContext,
  markSlotted?: () => void
): BrickConf | BrickConf[] {
  // Ignore `if: null` to make `looseCheckIf` working.
  if (brickConfInTemplate.if === null) {
    delete brickConfInTemplate.if;
  }

  if (brickConfInTemplate.brick === "slot") {
    markSlotted?.();
    return replaceSlotWithSlottedBricks(
      brickConfInTemplate,
      hostContext,
      expandBrickInTemplate
    );
  }

  const {
    properties,
    slots: slotsInTemplate,
    children: childrenInTemplate,
    ...restBrickConfInTemplate
  } = brickConfInTemplate as BrickConfInTemplate;

  const transpiledSlots = childrenToSlots(
    childrenInTemplate,
    slotsInTemplate
  ) as SlotsConfInTemplate | undefined;

  let slotted = false;
  const markChild = () => {
    slotted = true;
  };
  const slots = Object.fromEntries<SlotConfOfBricks>(
    Object.entries(transpiledSlots ?? {}).map(([slotName, slotConf]) => [
      slotName,
      {
        type: "bricks",
        bricks: (slotConf.bricks ?? []).flatMap((item) =>
          expandBrickInTemplate(item, hostContext, markChild)
        ),
      },
    ])
  );

  return {
    ...restBrickConfInTemplate,
    properties: setupUseBrickInTemplate(properties, hostContext),
    slots,
    ...setupTemplateProxy(
      hostContext,
      restBrickConfInTemplate.ref,
      slots,
      slotted
    ),
  };
}
