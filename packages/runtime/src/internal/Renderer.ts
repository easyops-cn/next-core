import type {
  BrickConf,
  BrickConfInTemplate,
  ContextConf,
  MenuConf,
  RouteConf,
  SlotConfOfBricks,
  SlotsConf,
  StaticMenuConf,
} from "@next-core/types";
import {
  enqueueStableLoadBricks,
  loadBricksImperatively,
  loadProcessorsImperatively,
  loadScript,
  loadStyle,
} from "@next-core/loader";
import { isTrackAll } from "@next-core/cook";
import { hasOwnProperty } from "@next-core/utils/general";
import { debounce } from "lodash";
import { asyncCheckBrickIf } from "./compute/checkIf.js";
import {
  asyncComputeRealPropertyEntries,
  constructAsyncProperties,
} from "./compute/computeRealProperties.js";
import { resolveData } from "./data/resolveData.js";
import { asyncComputeRealValue } from "./compute/computeRealValue.js";
import {
  TrackingContextItem,
  listenOnTrackingContext,
} from "./compute/listenOnTrackingContext.js";
import { RendererContext } from "./RendererContext.js";
import { matchRoutes } from "./matchRoutes.js";
import {
  symbolForAsyncComputedPropsFromHost,
  symbolForTPlExternalForEachItem,
  symbolForTplStateStoreId,
} from "./CustomTemplates/constants.js";
import { expandCustomTemplate } from "./CustomTemplates/expandCustomTemplate.js";
import type {
  RenderBrick,
  RenderNode,
  RuntimeBrickConfWithSymbols,
  RuntimeContext,
} from "./interfaces.js";
import {
  getTagNameOfCustomTemplate,
  getTplStateStore,
} from "./CustomTemplates/utils.js";
import { customTemplates } from "../CustomTemplates.js";
import type { NextHistoryState } from "./historyExtended.js";
import { getBrickPackages, hooks } from "./Runtime.js";
import { RenderTag } from "./enums.js";
import { getTracks } from "./compute/getTracks.js";
import { isStrictMode, warnAboutStrictMode } from "../isStrictMode.js";
import {
  FORM_RENDERER,
  RuntimeBrickConfOfFormSymbols,
  symbolForFormStateStoreId,
} from "./FormRenderer/constants.js";
import { expandFormRenderer } from "./FormRenderer/expandFormRenderer.js";
import { isPreEvaluated } from "./compute/evaluate.js";
import { getPreEvaluatedRaw } from "./compute/evaluate.js";
import { RuntimeBrickConfOfTplSymbols } from "./CustomTemplates/constants.js";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";

export interface RenderOutput {
  node?: RenderBrick;
  unauthenticated?: boolean;
  redirect?: {
    path: string;
    state?: NextHistoryState;
  };
  route?: RouteConf;
  blockingList: (Promise<unknown> | undefined)[];
  menuRequests: (Promise<StaticMenuConf | undefined> | undefined)[];
  hasTrackingControls?: boolean;
}

export async function renderRoutes(
  returnNode: RenderNode,
  routes: RouteConf[],
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string
): Promise<RenderOutput> {
  const matched = await matchRoutes(routes, _runtimeContext);
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };
  switch (matched) {
    case "missed":
      break;
    case "unauthenticated":
      output.unauthenticated = true;
      break;
    default: {
      const route = (output.route = matched.route);
      const runtimeContext = {
        ..._runtimeContext,
        match: matched.match,
      };
      runtimeContext.ctxStore.define(route.context, runtimeContext);
      runtimeContext.pendingPermissionsPreCheck.push(
        hooks?.checkPermissions?.preCheckPermissionsForBrickOrRoute(
          route,
          (value) => asyncComputeRealValue(value, runtimeContext)
        )
      );

      // Currently, this is only used for brick size-checking: these bricks
      // will be loaded before page rendering, but they will NOT be rendered.
      const { preLoadBricks } = route as { preLoadBricks?: string[] };
      if (Array.isArray(preLoadBricks)) {
        output.blockingList.push(
          loadBricksImperatively(preLoadBricks, getBrickPackages())
        );
      }

      switch (route.type) {
        case "redirect": {
          let redirectTo: unknown;
          if (typeof route.redirect === "string") {
            redirectTo = await asyncComputeRealValue(
              route.redirect,
              runtimeContext
            );
          } else {
            const resolved = (await resolveData(
              {
                transform: "redirect",
                ...route.redirect,
              },
              runtimeContext
            )) as { redirect?: unknown };
            redirectTo = resolved.redirect;
          }
          if (typeof redirectTo !== "string") {
            // eslint-disable-next-line no-console
            console.error("Unexpected redirect result:", redirectTo);
            throw new Error(
              `Unexpected type of redirect result: ${typeof redirectTo}`
            );
          }
          output.redirect = { path: redirectTo };
          break;
        }
        case "routes": {
          output.menuRequests.push(loadMenu(route.menu, runtimeContext));
          const newOutput = await renderRoutes(
            returnNode,
            route.routes,
            runtimeContext,
            rendererContext,
            slotId
          );
          mergeRenderOutput(output, newOutput);
          break;
        }
        default: {
          output.menuRequests.push(loadMenu(route.menu, runtimeContext));
          const newOutput = await renderBricks(
            returnNode,
            route.bricks,
            runtimeContext,
            rendererContext,
            slotId
          );
          mergeRenderOutput(output, newOutput);
        }
      }
    }
  }
  return output;
}

export async function renderBricks(
  returnNode: RenderNode,
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string,
  tplStack?: Map<string, number>,
  keyPath?: number[]
): Promise<RenderOutput> {
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };
  const kPath = keyPath ?? [];
  // 多个构件并行异步转换，但转换的结果按原顺序串行合并。
  const rendered = await Promise.all(
    bricks.map((brickConf, index) =>
      renderBrick(
        returnNode,
        brickConf,
        runtimeContext,
        rendererContext,
        slotId,
        kPath.concat(index),
        tplStack && new Map(tplStack)
      )
    )
  );

  rendered.forEach((item, index) => {
    if (item.hasTrackingControls) {
      // Memoize a render node before it's been merged.
      rendererContext.memoizeControlNode(
        slotId,
        kPath.concat(index),
        item.node,
        returnNode
      );
    }
    mergeRenderOutput(output, item);
  });

  return output;
}

export async function renderBrick(
  returnNode: RenderNode,
  brickConf: RuntimeBrickConfWithSymbols,
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string,
  keyPath: number[] = [],
  tplStack = new Map<string, number>()
): Promise<RenderOutput> {
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };

  if (!brickConf.brick) {
    if ((brickConf as { template?: string }).template) {
      // eslint-disable-next-line no-console
      console.error("Legacy templates are dropped in v3:", brickConf);
    } else {
      // eslint-disable-next-line no-console
      console.error("Invalid brick:", brickConf);
    }
    return output;
  }

  // Translate `if: "<%= ... %>"` to `brick: ":if", dataSource: "<%= ... %>"`.
  // In other words, translate tracking if expressions to tracking control nodes of `:if`.
  const { if: brickIf, permissionsPreCheck, ...restBrickConf } = brickConf;
  if (isGeneralizedTrackAll(brickIf)) {
    return renderBrick(
      returnNode,
      {
        brick: ":if",
        dataSource: brickIf,
        // `permissionsPreCheck` maybe required before computing `if`.
        permissionsPreCheck,
        slots: {
          "": {
            type: "bricks",
            bricks: [restBrickConf],
          },
        },
        // These symbols have to be copied to the new brick conf.
        ...Object.getOwnPropertySymbols(brickConf).reduce(
          (acc, symbol) => ({
            ...acc,
            [symbol]: (brickConf as any)[symbol],
          }),
          {} as RuntimeBrickConfOfTplSymbols & RuntimeBrickConfOfFormSymbols
        ),
      },
      _runtimeContext,
      rendererContext,
      slotId,
      keyPath,
      tplStack
    );
  }

  const tplStateStoreId = brickConf[symbolForTplStateStoreId];
  const formStateStoreId = brickConf[symbolForFormStateStoreId];
  const runtimeContext = {
    ..._runtimeContext,
    tplStateStoreId,
    formStateStoreId,
  };

  if (hasOwnProperty(brickConf, symbolForTPlExternalForEachItem)) {
    // The external bricks of a template should restore their `forEachItem`
    // from their host.
    runtimeContext.forEachItem = brickConf[symbolForTPlExternalForEachItem];
  }

  const { context } = brickConf as { context?: ContextConf[] };
  // istanbul ignore next
  if (Array.isArray(context) && context.length > 0) {
    const strict = isStrictMode(runtimeContext);
    warnAboutStrictMode(
      strict,
      "Defining context on bricks",
      "check your brick:",
      brickConf
    );
    if (!strict) {
      runtimeContext.ctxStore.define(context, runtimeContext);
    }
  }

  runtimeContext.pendingPermissionsPreCheck.push(
    hooks?.checkPermissions?.preCheckPermissionsForBrickOrRoute(
      brickConf,
      (value) => asyncComputeRealValue(value, runtimeContext)
    )
  );

  if (!(await asyncCheckBrickIf(brickConf, runtimeContext))) {
    return output;
  }

  const brickName = brickConf.brick;
  if (brickName.startsWith(":")) {
    ensureValidControlBrick(brickName);

    const { dataSource } = brickConf;

    const renderControlNode = async () => {
      // First, compute the `dataSource`
      const computedDataSource = await asyncComputeRealValue(
        dataSource,
        runtimeContext
      );

      // Then, get the matched slot.
      const slot =
        brickName === ":forEach"
          ? ""
          : brickName === ":switch"
          ? String(computedDataSource)
          : computedDataSource
          ? ""
          : "else";

      // Don't forget to transpile children to slots.
      const slots = childrenToSlots(brickConf.children, brickConf.slots);

      // Then, get the bricks in that matched slot.
      const bricks =
        slots &&
        hasOwnProperty(slots, slot) &&
        (slots[slot] as SlotConfOfBricks)?.bricks;

      if (!Array.isArray(bricks)) {
        return output;
      }

      switch (brickName) {
        case ":forEach": {
          if (!Array.isArray(computedDataSource)) {
            return output;
          }
          return renderForEach(
            returnNode,
            computedDataSource,
            bricks,
            runtimeContext,
            rendererContext,
            slotId,
            tplStack,
            keyPath
          );
        }
        case ":if":
        case ":switch": {
          return renderBricks(
            returnNode,
            bricks,
            runtimeContext,
            rendererContext,
            slotId,
            tplStack,
            keyPath
          );
        }
      }
    };

    const controlledOutput = await renderControlNode();

    const { contextNames, stateNames } = getTracks(dataSource);
    if (contextNames || stateNames) {
      controlledOutput.hasTrackingControls = true;
      let renderId = 0;
      const listener = async () => {
        const currentRenderId = ++renderId;
        const controlOutput = await renderControlNode();
        controlOutput.blockingList.push(
          ...[
            ...runtimeContext.tplStateStoreMap.values(),
            ...runtimeContext.formStateStoreMap.values(),
          ].map((store) => store.waitForAll()),
          ...runtimeContext.pendingPermissionsPreCheck
        );
        await Promise.all(controlOutput.blockingList);
        // Ignore stale renders
        if (renderId === currentRenderId) {
          rendererContext.rerenderControlNode(
            slotId,
            keyPath,
            controlOutput.node,
            returnNode
          );
        }
      };
      const debouncedListener = debounce(listener);
      if (contextNames) {
        for (const contextName of contextNames) {
          runtimeContext.ctxStore.onChange(contextName, debouncedListener);
        }
      }
      if (stateNames) {
        for (const contextName of stateNames) {
          const tplStateStore = getTplStateStore(
            runtimeContext,
            "STATE",
            `: "${dataSource}"`
          );
          tplStateStore.onChange(contextName, debouncedListener);
        }
      }
    }

    return controlledOutput;
  }

  // Widgets need to be defined before rendering.
  if (/\.tpl-/.test(brickName) && !customTemplates.get(brickName)) {
    await catchLoad(
      loadBricksImperatively([brickName], getBrickPackages()),
      "brick",
      brickName,
      rendererContext.unknownBricks
    );
  }

  const tplTagName = getTagNameOfCustomTemplate(
    brickName,
    runtimeContext.app?.id
  );

  if (tplTagName) {
    const tplCount = tplStack.get(tplTagName) ?? 0;
    if (tplCount >= 10) {
      throw new Error(
        `Maximum custom template stack overflowed: "${tplTagName}"`
      );
    }
    tplStack.set(tplTagName, tplCount + 1);
  } else if (brickName.includes("-") && !customElements.get(brickName)) {
    if (brickName === FORM_RENDERER) {
      customElements.define(
        FORM_RENDERER,
        class FormRendererElement extends HTMLElement {
          get $$typeof(): string {
            return "form-renderer";
          }
        }
      );
    } else {
      output.blockingList.push(
        catchLoad(
          enqueueStableLoadBricks([brickName], getBrickPackages()),
          "brick",
          brickName,
          rendererContext.unknownBricks
        )
      );
    }
  }

  let formData: unknown;
  let confProps: Record<string, unknown> | undefined;
  if (brickName === FORM_RENDERER) {
    ({ formData, ...confProps } = brickConf.properties ?? {});
  } else {
    confProps = brickConf.properties;
  }

  const trackingContextList: TrackingContextItem[] = [];
  const asyncPropertyEntries = asyncComputeRealPropertyEntries(
    confProps,
    runtimeContext,
    trackingContextList
  );

  const computedPropsFromHost = brickConf[symbolForAsyncComputedPropsFromHost];
  if (computedPropsFromHost) {
    asyncPropertyEntries.push(...computedPropsFromHost);
  }

  const isScript = brickName === "script";
  if (isScript || brickName === "link") {
    const props = await constructAsyncProperties(asyncPropertyEntries);
    if (isScript ? props.src : props.rel === "stylesheet" && props.href) {
      const prefix = window.PUBLIC_ROOT ?? "";
      if (isScript) {
        const { src, ...attrs } = props;
        await catchLoad(
          loadScript(src as string, prefix, attrs),
          "script",
          src as string,
          "silent"
        );
      } else {
        const { href, ...attrs } = props;
        await catchLoad(
          loadStyle(href as string, prefix, attrs),
          "stylesheet",
          href as string,
          "silent"
        );
      }
      return output;
    }
  }

  const brick: RenderBrick = {
    tag: RenderTag.BRICK,
    type: tplTagName || brickName,
    return: returnNode,
    slotId,
    events: brickConf.events,
    runtimeContext,
    portal: brickConf.portal,
    iid: brickConf.iid,
    ref: (brickConf as BrickConfInTemplate).ref,
  };

  output.node = brick;

  // 在最终挂载前，先加载所有可能用到的 processors。
  const usedProcessors = strictCollectMemberUsage(
    [brickConf.events, brickConf.lifeCycle],
    "PROCESSORS",
    2
  );
  if (usedProcessors.size > 0) {
    output.blockingList.push(
      catchLoad(
        loadProcessorsImperatively(usedProcessors, getBrickPackages()),
        "processors",
        [...usedProcessors].join(", "),
        rendererContext.unknownBricks
      )
    );
  }

  // 加载构件属性和加载子构件等任务，可以并行。
  const blockingList: Promise<unknown>[] = [];

  const loadProperties = async () => {
    brick.properties = await constructAsyncProperties(asyncPropertyEntries);
    listenOnTrackingContext(brick, trackingContextList);
  };
  blockingList.push(loadProperties());

  rendererContext.registerBrickLifeCycle(brick, brickConf.lifeCycle);

  let expandedBrickConf = brickConf;
  if (tplTagName) {
    expandedBrickConf = expandCustomTemplate(
      tplTagName,
      brickConf,
      brick,
      asyncPropertyEntries,
      rendererContext
    );
  } else if (brickName === FORM_RENDERER) {
    expandedBrickConf = expandFormRenderer(
      formData,
      brickConf,
      brick,
      asyncPropertyEntries,
      rendererContext
    );
  }

  if (expandedBrickConf.portal) {
    // A portal brick has no slotId.
    brick.slotId = undefined;
  }

  let childRuntimeContext: RuntimeContext;
  if (tplTagName) {
    // There is a boundary for `forEachItem` between template internals and externals.
    childRuntimeContext = {
      ...runtimeContext,
    };
    delete childRuntimeContext.forEachItem;
  } else {
    childRuntimeContext = runtimeContext;
  }

  const loadChildren = async () => {
    const slots = childrenToSlots(
      expandedBrickConf.children,
      expandedBrickConf.slots
    );
    if (!slots) {
      return;
    }
    const rendered = await Promise.all(
      Object.entries(slots).map(([childSlotId, slotConf]) =>
        slotConf.type !== "routes"
          ? renderBricks(
              brick,
              (slotConf as SlotConfOfBricks).bricks,
              childRuntimeContext,
              rendererContext,
              childSlotId,
              tplStack
            )
          : renderRoutes(
              brick,
              slotConf.routes,
              childRuntimeContext,
              rendererContext,
              childSlotId
            )
      )
    );

    const childrenOutput: RenderOutput = {
      ...output,
      node: undefined,
      blockingList: [],
    };
    for (const item of rendered) {
      mergeRenderOutput(childrenOutput, item);
    }
    if (childrenOutput.node) {
      brick.child = childrenOutput.node;
    }
    mergeRenderOutput(output, {
      ...childrenOutput,
      node: undefined,
    });
  };
  blockingList.push(loadChildren());

  await Promise.all(blockingList);

  return output;
}

function isGeneralizedTrackAll(brickIf: unknown): boolean {
  return typeof brickIf === "string"
    ? isTrackAll(brickIf)
    : isPreEvaluated(brickIf) &&
        // istanbul ignore next: covered by e2e tests
        isTrackAll(getPreEvaluatedRaw(brickIf));
}

type ValidControlBrick = ":forEach" | ":if" | ":switch";

function ensureValidControlBrick(
  brick: string
): asserts brick is ValidControlBrick {
  if (brick !== ":forEach" && brick !== ":if" && brick !== ":switch") {
    throw new Error(`Unknown storyboard control node: "${brick}"`);
  }
}

async function renderForEach(
  returnNode: RenderNode,
  dataSource: unknown[],
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId: string | undefined,
  tplStack: Map<string, number>,
  keyPath: number[]
): Promise<RenderOutput> {
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };

  const rows = dataSource.length;
  const rendered = await Promise.all(
    dataSource.map((item, i) =>
      Promise.all(
        bricks.map((brickConf, j) =>
          renderBrick(
            returnNode,
            brickConf,
            {
              ...runtimeContext,
              forEachItem: item,
            },
            rendererContext,
            slotId,
            keyPath.concat(i * rows + j),
            tplStack && new Map(tplStack)
          )
        )
      )
    )
  );

  // 多层构件并行异步转换，但转换的结果按原顺序串行合并。
  rendered.flat().forEach((item, index) => {
    if (item.hasTrackingControls) {
      // Memoize a render node before it's been merged.
      rendererContext.memoizeControlNode(
        slotId,
        keyPath.concat(index),
        item.node,
        returnNode
      );
    }
    mergeRenderOutput(output, item);
  });

  return output;
}

function loadMenu(
  menuConf: MenuConf | undefined,
  runtimeContext: RuntimeContext
) {
  if (!menuConf) {
    return;
  }

  // istanbul ignore next
  if ((menuConf as { type?: "brick" }).type === "brick") {
    // eslint-disable-next-line no-console
    console.error("Set menu with brick is dropped in v3:", menuConf);
    throw new Error("Set menu with brick is dropped in v3");
  }

  // istanbul ignore next
  if (menuConf.type === "resolve") {
    // eslint-disable-next-line no-console
    console.warn("Set menu with resolve is not supported in v3 yet:", menuConf);
    return;
  }

  return asyncComputeRealValue(
    menuConf,
    runtimeContext
  ) as Promise<StaticMenuConf>;
}

function mergeRenderOutput(
  output: RenderOutput,
  newOutput: RenderOutput
): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blockingList, node, menuRequests, hasTrackingControls, ...rest } =
    newOutput;
  output.blockingList.push(...blockingList);
  output.menuRequests.push(...menuRequests);

  if (node) {
    if (output.node) {
      let last = output.node;
      while (last.sibling) {
        last = last.sibling;
      }
      last.sibling = node;
    } else {
      output.node = node;
    }
  }

  Object.assign(output, rest);
}

export function childrenToSlots(
  children: BrickConf[] | undefined,
  originalSlots: SlotsConf | undefined
) {
  let newSlots = originalSlots;
  // istanbul ignore next
  if (
    process.env.NODE_ENV === "development" &&
    children &&
    !Array.isArray(children)
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "Specified brick children but not array:",
      `<${typeof children}>`,
      children
    );
  }
  if (Array.isArray(children) && !newSlots) {
    newSlots = {};
    for (const child of children) {
      const slot = child.slot ?? "";
      if (!hasOwnProperty(newSlots, slot)) {
        newSlots[slot] = {
          type: "bricks",
          bricks: [],
        };
      }
      (newSlots[slot] as SlotConfOfBricks).bricks.push(child);
    }
  }
  return newSlots;
}

function catchLoad(
  promise: Promise<unknown>,
  type: "brick" | "processors" | "script" | "stylesheet",
  name: string,
  unknownPolicy: RendererContext["unknownBricks"]
) {
  return unknownPolicy === "silent"
    ? promise.catch((e) => {
        // eslint-disable-next-line no-console
        console.error(`Load ${type} "${name}" failed:`, e);
      })
    : promise;
}
