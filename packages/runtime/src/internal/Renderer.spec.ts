import { jest, describe, test, expect } from "@jest/globals";
import type { RouteConf } from "@next-core/types";
import { createProviderClass } from "@next-core/utils/storyboard";
import { RenderRoot, RuntimeContext } from "./interfaces.js";
import { RenderTag } from "./enums.js";
import { renderBrick, renderBricks, renderRoutes } from "./Renderer.js";
import { RendererContext } from "./RendererContext.js";
import { DataStore } from "./data/DataStore.js";
import { preCheckPermissionsForBrickOrRoute } from "./checkPermissions.js";
import { enqueueStableLoadBricks } from "@next-core/loader";
import { mountTree, unmountTree } from "./mount.js";
import { getHistory } from "../history.js";
import { mediaEventTarget } from "./mediaQuery.js";
import { customTemplates } from "../CustomTemplates.js";
import { getTplStateStore } from "./CustomTemplates/utils.js";
import { symbolForTplStateStoreId } from "./CustomTemplates/constants.js";
import { FormDataProperties } from "./FormRenderer/interfaces.js";
import { FORM_RENDERER } from "./FormRenderer/constants.js";

jest.mock("@next-core/loader");
jest.mock("./checkPermissions.js");
jest.mock("../history.js");

const consoleError = jest.spyOn(console, "error");
const consoleInfo = jest.spyOn(console, "info");
const IntersectionObserver = jest.fn((callback: Function) => {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
  };
});
(window as any).IntersectionObserver = IntersectionObserver;
const mockGetHistory = getHistory as jest.Mock;

const myTimeoutProvider = jest.fn(
  (timeout: number, result: unknown) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(result), timeout);
    })
);
customElements.define(
  "my-timeout-provider",
  createProviderClass(myTimeoutProvider)
);

const formRendererBricks = [
  "basic-bricks.micro-view",
  "form.general-form",
  "forms.general-form",
  "forms.general-input",
  "forms.general-input-number",
  "forms.general-switch",
  "forms.general-select",
  "forms.general-textarea",
  "forms.general-date-picker",
  "forms.cmdb-instance-select-panel",
];
for (const brick of formRendererBricks) {
  customElements.define(brick, class MyElement extends HTMLElement {});
}

describe("renderRoutes", () => {
  test("general", async () => {
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      location: {
        pathname: "/home/HOST",
      },
      app: {
        homepage: "/home",
        noAuthGuard: true,
      },
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const route: RouteConf = {
      path: "${APP.homepage}/:objectId",
      context: [{ name: "objectId", value: "<% PATH.objectId %>" }],
      bricks: [{ brick: "div" }],
      menu: {
        menuId: "my-menu",
      },
    };
    const output = await renderRoutes(
      renderRoot,
      [route],
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [expect.any(Promise)],
      route,
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
      }),
    });
    expect(preCheckPermissionsForBrickOrRoute).toBeCalledTimes(2);
    const newRuntimeContext = {
      ...runtimeContext,
      match: expect.objectContaining({
        params: { objectId: "HOST" },
      }),
    };
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      1,
      route,
      newRuntimeContext
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      2,
      route.bricks[0],
      newRuntimeContext
    );
    expect(runtimeContext.pendingPermissionsPreCheck.length).toBe(2);
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("objectId")).toBe("HOST");
  });

  test("literal redirect", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      location: {
        pathname: "/home/HOST",
      },
      app: {
        homepage: "/home",
        noAuthGuard: true,
      },
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const route: RouteConf = {
      type: "redirect",
      path: "${APP.homepage}/:objectId",
      context: [{ name: "objectId", value: "<% PATH.objectId %>" }],
      redirect: "<% `${APP.homepage}/${CTX.objectId}/list` %>",
    };
    const output = await renderRoutes(
      null!,
      [route],
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
      route,
      redirect: { path: "/home/HOST/list" },
    });
  });

  test("resolve redirect", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      location: {
        pathname: "/home/HOST",
      },
      app: {
        homepage: "/home",
        noAuthGuard: true,
      },
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const route: RouteConf = {
      type: "redirect",
      path: "${APP.homepage}/:objectId",
      redirect: {
        useProvider: "my-timeout-provider",
        args: [1, "/outside"],
      },
    };
    const output = await renderRoutes(
      null!,
      [route],
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
      route,
      redirect: { path: "/outside" },
    });
  });

  test("unexpected resolve redirect", async () => {
    consoleError.mockReturnValueOnce();
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      location: {
        pathname: "/home/HOST",
      },
      app: {
        homepage: "/home",
        noAuthGuard: true,
      },
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const route: RouteConf = {
      type: "redirect",
      path: "${APP.homepage}/:objectId",
      redirect: {
        useProvider: "my-timeout-provider",
        args: [1, "/outside"],
        transform: {
          value: "<% DATA %>",
        },
      },
    };
    await expect(
      renderRoutes(null!, [route], runtimeContext, rendererContext)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Unexpected type of redirect result: undefined]`
    );
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      "Unexpected redirect result:",
      undefined
    );
  });

  test("sub-routes", async () => {
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      location: {
        pathname: "/home/HOST/list",
      },
      app: {
        homepage: "/home",
        noAuthGuard: true,
      },
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const brick = { brick: "div" };
    const route: RouteConf = {
      type: "routes",
      path: "${APP.homepage}/:objectId",
      exact: false,
      context: [{ name: "objectId", value: "<% PATH.objectId %>" }],
      routes: [
        {
          path: "${APP.homepage}/:objectId/list",
          exact: true,
          bricks: [brick],
        },
      ],
    };
    const output = await renderRoutes(
      renderRoot,
      [route],
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [undefined, undefined],
      route: route.routes[0],
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
      }),
    });
    expect(preCheckPermissionsForBrickOrRoute).toBeCalledTimes(3);
    const newRuntimeContext = {
      ...runtimeContext,
      match: expect.objectContaining({
        params: { objectId: "HOST" },
      }),
    };
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      1,
      route,
      newRuntimeContext
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      2,
      route.routes[0],
      newRuntimeContext
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      3,
      brick,
      newRuntimeContext
    );
    expect(runtimeContext.pendingPermissionsPreCheck.length).toBe(3);
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("objectId")).toBe("HOST");
  });

  test("missed", async () => {
    const runtimeContext = {
      location: {
        pathname: "/home/HOST",
      },
      app: {
        homepage: "/home",
        noAuthGuard: true,
      },
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const route: RouteConf = {
      path: "${APP.homepage}/about",
      bricks: [{ brick: "div" }],
    };
    const output = await renderRoutes(
      null!,
      [route],
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
    });
  });

  test("unauthenticated", async () => {
    const runtimeContext = {
      location: {
        pathname: "/home/HOST",
      },
      app: {
        homepage: "/home",
      },
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const route: RouteConf = {
      path: "${APP.homepage}/:objectId",
      bricks: [{ brick: "div" }],
    };
    const output = await renderRoutes(
      null!,
      [route],
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
      unauthenticated: true,
    });
  });

  test("empty routes", async () => {
    const output = await renderRoutes(null!, [], null!, null!);
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
    });
  });
});

describe("renderBrick", () => {
  test("general", async () => {
    consoleInfo.mockReturnValue();
    mockGetHistory.mockReturnValue({
      location: {
        hash: "#",
      },
    });
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const output = await renderBrick(
      renderRoot,
      {
        brick: "test.my-brick",
        lifeCycle: {
          onBeforePageLoad: {
            action: "console.info",
            args: ["onBeforePageLoad", "<% EVENT.type %>"],
          },
          onPageLoad: {
            action: "console.info",
            args: ["onPageLoad", "<% EVENT.type %>"],
          },
          onAnchorLoad: {
            action: "console.info",
            args: ["onAnchorLoad", "<% EVENT.type %>"],
          },
          onAnchorUnload: {
            action: "console.info",
            args: ["onAnchorUnload", "<% EVENT.type %>"],
          },
          onMount: {
            action: "console.info",
            args: ["onMount", "<% EVENT.type %>"],
          },
          onUnmount: {
            action: "console.info",
            args: ["onUnmount", "<% EVENT.type %>"],
          },
          onBeforePageLeave: {
            action: "console.info",
            args: ["onBeforePageLeave", "<% EVENT.type %>"],
          },
          onPageLeave: {
            action: "console.info",
            args: ["onPageLeave", "<% EVENT.type %>"],
          },
        },
        slots: {
          a: {
            bricks: [
              {
                brick: "div",
                lifeCycle: {
                  onMediaChange: {
                    action: "console.info",
                    args: [
                      "onMediaChange",
                      "<% EVENT.type %>",
                      "<% EVENT.detail %>",
                    ],
                  },
                  onScrollIntoView: {
                    handlers: [
                      {
                        action: "console.info",
                        args: ["onScrollIntoView", "<% EVENT.type %>"],
                      },
                    ],
                  },
                },
              },
            ],
          },
          b: {
            bricks: [{ brick: "span", portal: true }],
          },
        },
      },
      runtimeContext,
      rendererContext
    );
    expect(output.blockingList.length).toBe(1);
    expect(output.menuRequests.length).toBe(0);
    expect(enqueueStableLoadBricks).toBeCalledWith(["test.my-brick"], []);
    expect(output.node).toMatchObject({
      tag: RenderTag.BRICK,
      type: "test.my-brick",
    });
    expect(output.node?.return).toBe(renderRoot);
    expect(output.node?.child).toMatchObject({
      tag: RenderTag.BRICK,
      type: "div",
      slotId: "a",
      portal: undefined,
    });
    expect(output.node?.child?.return).toBe(output.node);
    expect(output.node?.child?.sibling).toMatchObject({
      tag: RenderTag.BRICK,
      type: "span",
      slotId: undefined,
      portal: true,
    });
    expect(output.node?.child?.sibling?.return).toBe(output.node);
    expect(output.node?.child?.child).toBe(undefined);
    expect(output.node?.child?.sibling?.child).toBe(undefined);
    expect(output.node?.child?.sibling?.sibling).toBe(undefined);

    expect(consoleInfo).toBeCalledTimes(0);
    rendererContext.dispatchBeforePageLoad();
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "onBeforePageLoad",
      "page.beforeLoad"
    );
    rendererContext.dispatchPageLoad();
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "onPageLoad", "page.load");
    rendererContext.dispatchAnchorLoad();
    expect(consoleInfo).toHaveBeenNthCalledWith(
      3,
      "onAnchorUnload",
      "anchor.unload"
    );
    rendererContext.dispatchOnMount();
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "onMount", "mount");

    mockGetHistory.mockReturnValue({
      location: {
        hash: "#abc",
      },
    });
    rendererContext.dispatchAnchorLoad();
    expect(consoleInfo).toHaveBeenNthCalledWith(
      5,
      "onAnchorLoad",
      "anchor.load"
    );

    rendererContext.initializeScrollIntoView();
    rendererContext.initializeMediaChange();
    expect(consoleInfo).toBeCalledTimes(5);

    IntersectionObserver.mock.calls[0][0](
      [
        { isIntersecting: false },
        { isIntersecting: true, intersectionRatio: 0.05 },
        { isIntersecting: true, intersectionRatio: 0.1 },
      ],
      { disconnect: jest.fn() }
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      6,
      "onScrollIntoView",
      "scroll.into.view"
    );

    mediaEventTarget.dispatchEvent(
      new CustomEvent("change", { detail: { breakpoint: "large" } })
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      7,
      "onMediaChange",
      "media.change",
      { breakpoint: "large" }
    );

    rendererContext.dispatchBeforePageLeave({});
    expect(consoleInfo).toHaveBeenNthCalledWith(
      8,
      "onBeforePageLeave",
      "page.beforeLeave"
    );
    rendererContext.dispatchPageLeave();
    expect(consoleInfo).toHaveBeenNthCalledWith(9, "onPageLeave", "page.leave");
    rendererContext.dispatchOnUnmount();
    expect(consoleInfo).toHaveBeenNthCalledWith(10, "onUnmount", "unmount");

    rendererContext.dispose();
    consoleInfo.mockReset();
    mockGetHistory.mockReset();
  });

  test("if: false", async () => {
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const output = await renderBrick(
      renderRoot,
      {
        brick: "div",
        if: false,
      },
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
    });
    expect(runtimeContext.pendingPermissionsPreCheck.length).toBe(1);
  });

  test("Legacy template", async () => {
    consoleError.mockReturnValueOnce();
    const brick: any = {
      template: "legacy-template",
    };
    const output = await renderBrick(null!, brick, null!, null!);
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
    });
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      "Legacy templates are dropped in v3:",
      brick
    );
  });

  test("invalid brick", async () => {
    consoleError.mockReturnValueOnce();
    const brick: any = {
      foo: "bar",
    };
    const output = await renderBrick(null!, brick, null!, null!);
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
    });
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Invalid brick:", brick);
  });
});

describe("renderBrick for control nodes", () => {
  test(":forEach", async () => {
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "list",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, ["a", "b"]],
          },
        },
      ],
      runtimeContext
    );
    const rendererContext = new RendererContext("page");
    const [output1, output2] = await Promise.all([
      renderBrick(
        renderRoot,
        {
          brick: ":forEach",
          dataSource: "<% CTX.list %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% ITEM %>",
              },
            },
          ],
        },
        runtimeContext,
        rendererContext
      ),
      renderBrick(
        renderRoot,
        {
          brick: ":forEach",
          // Not array
          dataSource: "<% CTX.list.length %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% ITEM %>",
              },
            },
          ],
        },
        runtimeContext,
        rendererContext
      ),
    ]);
    expect(output1).toEqual({
      blockingList: [],
      menuRequests: [],
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
        properties: {
          textContent: "a",
        },
        slotId: undefined,
        sibling: expect.objectContaining({
          tag: RenderTag.BRICK,
          return: renderRoot,
          type: "div",
          properties: {
            textContent: "b",
          },
          slotId: undefined,
        }),
      }),
    });
    expect(output2).toEqual({
      blockingList: [],
      menuRequests: [],
    });
  });

  test(":forEach and track", async () => {
    consoleInfo.mockReturnValue();
    const container = document.createElement("div");
    const portal = document.createElement("div");
    const renderRoot = {
      tag: RenderTag.ROOT,
      container,
      createPortal: portal,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      tplStateStoreMap: new Map(),
      formStateStoreMap: new Map(),
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "list",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, ["a", "b"]],
          },
        },
      ],
      runtimeContext
    );
    const rendererContext = new RendererContext("page");
    const output = await renderBricks(
      renderRoot,
      [
        {
          brick: ":forEach",
          dataSource: "<% 'track context', CTX.list %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% ITEM %>",
              },
              lifeCycle: {
                onMount: {
                  action: "console.info",
                  args: ["onMount", "<% EVENT.type %>", "<% ITEM %>"],
                },
                onUnmount: {
                  action: "console.info",
                  args: ["onUnmount", "<% EVENT.type %>", "<% ITEM %>"],
                },
                onScrollIntoView: {
                  handlers: [
                    {
                      action: "console.info",
                      args: [
                        "onScrollIntoView",
                        "<% EVENT.type %>",
                        "<% ITEM %>",
                      ],
                    },
                  ],
                },
              },
            },
            {
              brick: "p",
              properties: {
                textContent: "<% `portal:${ITEM}` %>",
              },
              portal: true,
            },
          ],
        },
      ],
      runtimeContext,
      rendererContext,
      undefined
    );
    renderRoot.child = output.node;
    await Promise.all([...output.blockingList, ctxStore.waitForAll()]);
    mountTree(renderRoot);
    expect(consoleInfo).not.toBeCalled();
    rendererContext.dispatchOnMount();
    rendererContext.initializeScrollIntoView();
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "onMount", "mount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "onMount", "mount", "b");

    expect(container.innerHTML).toBe("<div>a</div><div>b</div>");
    expect(portal.innerHTML).toBe("<p>portal:a</p><p>portal:b</p>");

    (container.firstChild as HTMLElement).title = "mark";
    expect(container.innerHTML).toBe('<div title="mark">a</div><div>b</div>');

    ctxStore.updateValue("list", ["a", "c"], "replace");
    expect(consoleInfo).toBeCalledTimes(2);
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleInfo).toBeCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "onUnmount", "unmount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "onUnmount", "unmount", "b");
    expect(consoleInfo).toHaveBeenNthCalledWith(5, "onMount", "mount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "onMount", "mount", "c");

    // Note: previous `title="mark"` is removed
    expect(container.innerHTML).toBe("<div>a</div><div>c</div>");
    expect(portal.innerHTML).toBe("<p>portal:a</p><p>portal:c</p>");

    unmountTree(container);
    unmountTree(portal);
    rendererContext.dispose();
    consoleInfo.mockReset();
  });

  test(":if", async () => {
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "quality",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "good"],
          },
        },
      ],
      runtimeContext
    );
    const rendererContext = new RendererContext("page");
    const slots = {
      "": {
        bricks: [
          {
            brick: "div",
            properties: {
              textContent: "Good",
            },
          },
        ],
      },
      else: {
        bricks: [
          {
            brick: "div",
            properties: {
              textContent: "Bad",
            },
          },
        ],
      },
    };
    const [output1, output2, output3] = await Promise.all([
      renderBrick(
        renderRoot,
        {
          brick: ":if",
          dataSource: "<% CTX.quality === 'good' %>",
          slots,
        },
        runtimeContext,
        rendererContext
      ),
      renderBrick(
        renderRoot,
        {
          brick: ":if",
          dataSource: "<% CTX.quality !== 'good' %>",
          slots,
        },
        runtimeContext,
        rendererContext
      ),
      renderBrick(
        renderRoot,
        {
          brick: ":if",
          dataSource: "<% CTX.quality === 'good' %>",
          slots: {
            else: slots.else,
          },
        },
        runtimeContext,
        rendererContext
      ),
    ]);
    expect(output1).toEqual({
      blockingList: [],
      menuRequests: [],
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
        properties: {
          textContent: "Good",
        },
        slotId: undefined,
      }),
    });
    expect(output2).toEqual({
      blockingList: [],
      menuRequests: [],
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
        properties: {
          textContent: "Bad",
        },
        slotId: undefined,
      }),
    });
    expect(output3).toEqual({
      blockingList: [],
      menuRequests: [],
    });
  });

  test(":switch", async () => {
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "score",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, 80],
          },
        },
      ],
      runtimeContext
    );
    const rendererContext = new RendererContext("page");
    const output = await renderBrick(
      renderRoot,
      {
        brick: ":switch",
        dataSource: "<% CTX.score > 90 ? 'a' : CTX.score > 60 ? 'b' : 'c' %>",
        children: [
          {
            brick: "div",
            slot: "a",
            properties: {
              textContent: "A",
            },
          },
          {
            brick: "div",
            slot: "b",
            properties: {
              textContent: "B",
            },
          },
          {
            brick: "div",
            slot: "c",
            properties: {
              textContent: "C",
            },
          },
        ],
      },
      runtimeContext,
      rendererContext
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequests: [],
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
        properties: {
          textContent: "B",
        },
        slotId: undefined,
      }),
    });
  });

  test("unknown control node", async () => {
    const renderRoot = {
      tag: RenderTag.ROOT,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    await expect(
      renderBrick(
        renderRoot,
        {
          brick: ":unknown",
          dataSource: ["bad"],
          children: [{ brick: "div" }],
        },
        runtimeContext,
        rendererContext
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: Unknown storyboard control node: ":unknown"]`
    );
  });
});

describe("renderBrick for tpl", () => {
  test("general", async () => {
    consoleInfo.mockReturnValue();
    customTemplates.define("my.tpl-a", {
      state: [
        {
          name: "x",
          value: "X",
          expose: true,
        },
        {
          name: "y",
          value: "Y",
          expose: false,
        },
        {
          name: "z",
          value: "Z",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "ResolvedZ"],
          },
        },
      ],
      proxy: {
        properties: {
          innerTitle: {
            ref: "d",
            refProperty: "title",
          },
        },
        slots: {
          "": {
            ref: "d",
            refPosition: 0,
          },
          outerToolbar: {
            ref: "d",
            refSlot: "innerToolbar",
          },
          empty: {
            ref: "d",
          },
        },
        events: {
          spanClick: {
            ref: "sp",
            refEvent: "click",
          },
        },
      },
      bricks: [
        {
          brick: "div",
          ref: "d",
          properties: {
            x: "<% STATE.x %>",
            y: "<% STATE.y %>",
            z: "<% STATE.z %>",
            useBrick: {
              brick: "i",
              if: "<% STATE.z && DATA %>",
            },
          },
          children: [
            {
              brick: "span",
              ref: "sp",
              properties: {
                id: "inner-span",
                textContent: "<% `I'm inner slot [${STATE.z}]` %>",
              },
            },
          ],
        },
      ],
    });

    const container = document.createElement("div");
    const portal = document.createElement("div");
    const renderRoot = {
      tag: RenderTag.ROOT,
      container,
      createPortal: portal,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      tplStateStoreMap: new Map(),
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const output = await renderBrick(
      renderRoot,
      {
        brick: "my.tpl-a",
        properties: {
          x: "X2",
          y: "Y2",
          innerTitle: "T",
        },
        children: [
          {
            brick: "strong",
            properties: {
              textContent: "I'm outer slot",
            },
          },
          {
            brick: "em",
            slot: "outerToolbar",
            properties: {
              textContent: "I'm outer toolbar",
            },
          },
        ],
        events: {
          spanClick: {
            action: "console.info",
            args: ["<% EVENT.type %>"],
          },
        },
      },
      runtimeContext,
      rendererContext
    );
    renderRoot.child = output.node;
    const { tplStateStoreId } = output.node!.tplHostMetadata!;
    expect(tplStateStoreId).toBeDefined();

    await Promise.all([
      ...output.blockingList,
      ctxStore.waitForAll(),
      ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
        store.waitForAll()
      ),
    ]);

    mountTree(renderRoot);
    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <my.tpl-a>
          <div
            title="T"
          >
            <strong>
              I'm outer slot
            </strong>
            <span
              id="inner-span"
            >
              I'm inner slot [ResolvedZ]
            </span>
            <em
              slot="innerToolbar"
            >
              I'm outer toolbar
            </em>
          </div>
        </my.tpl-a>,
      ]
    `);
    expect((container.firstChild as any).x).toBe("X2");
    expect((container.firstChild as any).y).toBe("Y2");
    expect((container.firstChild as any).z).toBe("ResolvedZ");
    expect((container.firstChild as any).firstChild.x).toBe("X2");
    expect((container.firstChild as any).firstChild.y).toBe("Y");
    expect((container.firstChild as any).firstChild.z).toBe("ResolvedZ");

    // Setup useBrick in template
    expect((container.firstChild as any).firstChild.useBrick).toEqual({
      brick: "i",
      if: {
        [Symbol.for("pre.evaluated.raw")]: "<% STATE.z && DATA %>",
        [Symbol.for("pre.evaluated.context")]: expect.objectContaining({
          tplStateStoreId,
        }),
      },
      slots: {},
      [symbolForTplStateStoreId]: tplStateStoreId,
    });

    const outerSpanClick = jest.fn();
    container.addEventListener("spanClick", outerSpanClick);
    container.querySelector("#inner-span")!.dispatchEvent(new Event("click"));
    expect(consoleInfo).toBeCalledTimes(1);
    expect(consoleInfo).toBeCalledWith("spanClick");
    expect(outerSpanClick).toBeCalledTimes(0);

    container
      .querySelector("#inner-span")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toBeCalledWith("spanClick");
    expect(outerSpanClick).toBeCalledTimes(1);

    consoleInfo.mockReset();
  });

  test("tpl with inner :forEach and track", async () => {
    consoleInfo.mockReturnValue();

    customTemplates.define("my.tpl-b", {
      state: [
        {
          name: "list",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, ["a", "b"]],
          },
        },
      ],
      bricks: [
        {
          brick: ":forEach",
          dataSource: "<% 'track state', STATE.list %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% ITEM %>",
              },
              lifeCycle: {
                onMount: {
                  action: "console.info",
                  args: ["onMount", "<% EVENT.type %>", "<% ITEM %>"],
                },
                onUnmount: {
                  action: "console.info",
                  args: ["onUnmount", "<% EVENT.type %>", "<% ITEM %>"],
                },
                onScrollIntoView: {
                  handlers: [
                    {
                      action: "console.info",
                      args: [
                        "onScrollIntoView",
                        "<% EVENT.type %>",
                        "<% ITEM %>",
                      ],
                    },
                  ],
                },
              },
            },
            {
              brick: "p",
              properties: {
                textContent: "<% `portal:${ITEM}` %>",
              },
              portal: true,
            },
          ],
        },
      ],
    });

    const container = document.createElement("div");
    const portal = document.createElement("div");
    const renderRoot = {
      tag: RenderTag.ROOT,
      container,
      createPortal: portal,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      tplStateStoreMap: new Map(),
      formStateStoreMap: new Map(),
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const output = await renderBricks(
      renderRoot,
      [{ brick: "my.tpl-b" }],
      runtimeContext,
      rendererContext,
      undefined
    );
    renderRoot.child = output.node;
    await Promise.all([
      ...output.blockingList,
      ctxStore.waitForAll(),
      ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
        store.waitForAll()
      ),
    ]);
    mountTree(renderRoot);
    expect(consoleInfo).not.toBeCalled();
    rendererContext.dispatchOnMount();
    rendererContext.initializeScrollIntoView();
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "onMount", "mount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "onMount", "mount", "b");

    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <my.tpl-b>
          <div>
            a
          </div>
          <div>
            b
          </div>
        </my.tpl-b>,
      ]
    `);
    expect(portal.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <p>
          portal:a
        </p>,
        <p>
          portal:b
        </p>,
      ]
    `);

    (container.firstChild?.firstChild as HTMLElement).title = "mark";
    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <my.tpl-b>
          <div
            title="mark"
          >
            a
          </div>
          <div>
            b
          </div>
        </my.tpl-b>,
      ]
    `);

    const stateStore = getTplStateStore(
      {
        tplStateStoreId: output.node?.tplHostMetadata?.tplStateStoreId,
        tplStateStoreMap: runtimeContext.tplStateStoreMap,
      },
      "test"
    );
    stateStore.updateValue("list", ["a", "c"], "replace");
    expect(consoleInfo).toBeCalledTimes(2);
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleInfo).toBeCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "onUnmount", "unmount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "onUnmount", "unmount", "b");
    expect(consoleInfo).toHaveBeenNthCalledWith(5, "onMount", "mount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "onMount", "mount", "c");

    // Note: previous `title="mark"` is removed
    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <my.tpl-b>
          <div>
            a
          </div>
          <div>
            c
          </div>
        </my.tpl-b>,
      ]
    `);
    expect(portal.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <p>
          portal:a
        </p>,
        <p>
          portal:c
        </p>,
      ]
    `);

    unmountTree(container);
    unmountTree(portal);
    rendererContext.dispose();
    consoleInfo.mockReset();
  });

  test("tpl with outer :forEach ", async () => {
    customTemplates.define("my.tpl-c", {
      state: [
        {
          name: "z",
          value: "Z",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "ResolvedZ"],
          },
        },
      ],
      proxy: {
        properties: {
          innerTitle: {
            ref: "d",
            refProperty: "title",
          },
        },
        slots: {
          "": {
            ref: "d",
            refPosition: 0,
          },
          outerToolbar: {
            ref: "d",
            refSlot: "innerToolbar",
          },
          empty: {
            ref: "d",
          },
        },
      },
      bricks: [
        {
          brick: "div",
          ref: "d",
          properties: {
            z: "<% STATE.z %>",
          },
          children: [
            {
              brick: "span",
              properties: {
                textContent: "<% `I'm inner slot [${STATE.z}]` %>",
              },
            },
          ],
        },
      ],
    });

    const container = document.createElement("div");
    const portal = document.createElement("div");
    const renderRoot = {
      tag: RenderTag.ROOT,
      container,
      createPortal: portal,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      tplStateStoreMap: new Map(),
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const output = await renderBrick(
      renderRoot,
      {
        brick: ":forEach",
        dataSource: ["a", "b"],
        children: [
          {
            brick: "my.tpl-c",
            properties: {
              innerTitle: "<% ITEM %>",
            },
            children: [
              {
                brick: "strong",
                properties: {
                  textContent: "<% `I'm outer slot [${ITEM}]` %>",
                },
              },
              {
                brick: "em",
                slot: "outerToolbar",
                properties: {
                  textContent: "<% `I'm outer toolbar [${ITEM}]` %>",
                },
              },
            ],
          },
        ],
      },
      runtimeContext,
      rendererContext
    );
    renderRoot.child = output.node;

    await Promise.all([
      ...output.blockingList,
      ctxStore.waitForAll(),
      ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
        store.waitForAll()
      ),
    ]);

    mountTree(renderRoot);
    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <my.tpl-c>
          <div
            title="a"
          >
            <strong>
              I'm outer slot [a]
            </strong>
            <span>
              I'm inner slot [ResolvedZ]
            </span>
            <em
              slot="innerToolbar"
            >
              I'm outer toolbar [a]
            </em>
          </div>
        </my.tpl-c>,
        <my.tpl-c>
          <div
            title="b"
          >
            <strong>
              I'm outer slot [b]
            </strong>
            <span>
              I'm inner slot [ResolvedZ]
            </span>
            <em
              slot="innerToolbar"
            >
              I'm outer toolbar [b]
            </em>
          </div>
        </my.tpl-c>,
      ]
    `);
  });
});

describe("renderBrick for form renderer", () => {
  test("general", async () => {
    const container = document.createElement("div");
    const portal = document.createElement("div");
    const renderRoot = {
      tag: RenderTag.ROOT,
      container,
      createPortal: portal,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      formStateStoreMap: new Map(),
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");

    const types = [
      "STRING",
      "INT",
      "FLOAT",
      "BOOLEAN",
      "ENUM",
      "ENUMS",
      "DATE",
      "TIME",
      "IP",
      "JSON",
      "ARRAY",
      "STRUCTURE",
      "STRUCTURE_ARRAY",
    ];

    const formData: FormDataProperties = {
      formSchema: {
        id: "form_1",
        brick: "forms.general-form",
        bricks: types.map((type) => ({
          id: type.toLowerCase(),
          mountPoint: "items",
        })),
      },
      fields: types.map((type) => ({
        fieldId: type.toLowerCase(),
        name: `My ${type}`,
        fieldType: type,
      })),
    };
    const output = await renderBrick(
      renderRoot,
      {
        brick: FORM_RENDERER,
        properties: {
          formData,
          renderRoot: false,
        },
      },
      runtimeContext,
      rendererContext
    );
    renderRoot.child = output.node;

    await Promise.all([
      ...output.blockingList,
      ctxStore.waitForAll(),
      ...[...runtimeContext.formStateStoreMap.values()].map((store) =>
        store.waitForAll()
      ),
    ]);

    mountTree(renderRoot);
    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <form-renderer.form-renderer>
          <forms.general-form>
            <forms.general-input
              data-testid="string"
              id="string"
              slot="items"
            />
            <forms.general-input-number
              data-testid="int"
              id="int"
              slot="items"
            />
            <forms.general-input-number
              data-testid="float"
              id="float"
              slot="items"
            />
            <forms.general-switch
              data-testid="boolean"
              id="boolean"
              slot="items"
            />
            <forms.general-select
              data-testid="enum"
              id="enum"
              slot="items"
            />
            <forms.general-select
              data-testid="enums"
              id="enums"
              slot="items"
            />
            <forms.general-date-picker
              data-testid="date"
              id="date"
              slot="items"
            />
            <forms.general-date-picker
              data-testid="time"
              id="time"
              slot="items"
            />
            <forms.general-input
              data-testid="ip"
              id="ip"
              slot="items"
            />
            <forms.general-textarea
              data-testid="json"
              id="json"
              slot="items"
            />
            <forms.general-select
              data-testid="array"
              id="array"
              slot="items"
            />
            <forms.cmdb-instance-select-panel
              data-testid="structure"
              id="structure"
              slot="items"
            />
            <forms.cmdb-instance-select-panel
              data-testid="structure_array"
              id="structure_array"
              slot="items"
            />
          </forms.general-form>
        </form-renderer.form-renderer>,
      ]
    `);
  });

  test("no render root", async () => {
    const container = document.createElement("div");
    const portal = document.createElement("div");
    const renderRoot = {
      tag: RenderTag.ROOT,
      container,
      createPortal: portal,
    } as RenderRoot;
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
      formStateStoreMap: new Map(),
      formStateStoreScope: [] as DataStore<"FORM_STATE">[],
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");

    const types = ["STRING"];

    const formData: FormDataProperties = {
      formSchema: {
        id: "form_1",
        brick: "form.general-form",
        bricks: types.map((type) => ({
          id: type.toLowerCase(),
          if: true,
        })),
        events: {
          "validate.success": {
            action: "console.log",
          },
        },
      },
      fields: types.map((type) => ({
        fieldId: type.toLowerCase(),
        name: `My ${type}`,
        fieldType: type,
      })),
      context: [
        {
          name: "params",
        },
      ],
    };
    const output = await renderBrick(
      renderRoot,
      {
        brick: FORM_RENDERER,
        properties: {
          formData: JSON.stringify(formData),
        },
        events: {
          "validate.success": {
            action: "console.info",
          },
          "validate.error": {
            action: "handleHttpError",
          },
        },
      },
      runtimeContext,
      rendererContext
    );
    renderRoot.child = output.node;

    await Promise.all([
      ...output.blockingList,
      ctxStore.waitForAll(),
      ...[...runtimeContext.formStateStoreMap.values()].map((store) =>
        store.waitForAll()
      ),
    ]);

    mountTree(renderRoot);
    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <form-renderer.form-renderer>
          <basic-bricks.micro-view
            style="padding: 12px;"
          >
            <form.general-form
              slot="content"
            >
              <forms.general-input
                data-testid="string"
                id="string"
              />
            </form.general-form>
          </basic-bricks.micro-view>
        </form-renderer.form-renderer>,
      ]
    `);
  });
});
