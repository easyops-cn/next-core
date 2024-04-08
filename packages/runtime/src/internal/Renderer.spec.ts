import { jest, describe, test, expect } from "@jest/globals";
import type { RouteConf, RouteConfOfBricks } from "@next-core/types";
import { createProviderClass } from "@next-core/utils/general";
import { RenderBrick, RenderRoot, RuntimeContext } from "./interfaces.js";
import { RenderTag } from "./enums.js";
import { renderBrick, renderBricks, renderRoutes } from "./Renderer.js";
import { RendererContext } from "./RendererContext.js";
import { DataStore } from "./data/DataStore.js";
import {
  enqueueStableLoadBricks,
  loadBricksImperatively,
  loadProcessorsImperatively,
  loadScript,
  loadStyle,
} from "@next-core/loader";
import { mountTree, unmountTree } from "./mount.js";
import { getHistory } from "../history.js";
import { mediaEventTarget } from "./mediaQuery.js";
import { customTemplates } from "../CustomTemplates.js";
import { getTplStateStore } from "./CustomTemplates/utils.js";
import { symbolForTplStateStoreId } from "./CustomTemplates/constants.js";
import { FormDataProperties } from "./FormRenderer/interfaces.js";
import { FORM_RENDERER } from "./FormRenderer/constants.js";
import { hooks } from "./Runtime.js";
import * as compute from "./compute/computeRealValue.js";
import { customProcessors } from "../CustomProcessors.js";
import * as __secret_internals from "./secret_internals.js";

jest.mock("@next-core/loader");
jest.mock("../history.js");
jest.mock("./Runtime.js", () => ({
  getBrickPackages() {
    return [];
  },
  hooks: {
    checkPermissions: {
      preCheckPermissionsForBrickOrRoute: jest.fn(
        async (container: RouteConf, asyncCompute: (v: unknown) => unknown) => {
          await asyncCompute(container.permissionsPreCheck);
        }
      ),
    },
    auth: {
      isLoggedIn() {
        return false;
      },
      getAuth() {
        return {};
      },
    },
    messageDispatcher: {
      onMessage(channel: string, callback: (detail: unknown) => void) {
        Promise.resolve().then(() => {
          callback(`message channel: ${channel}`);
        });
      },
      onClose(callback: () => void) {
        Promise.resolve().then(() => {
          callback();
        });
      },
    },
  },
  getRuntime() {
    //
  },
  _internalApiGetRuntimeContext() {
    return {};
  },
}));

(loadScript as jest.Mocked<typeof loadScript>).mockResolvedValue([]);
(loadStyle as jest.Mocked<typeof loadStyle>).mockResolvedValue([]);

customProcessors.define("def.rst", (input: string) => `received: ${input}`);

jest.spyOn(compute, "asyncComputeRealValue");

const { preCheckPermissionsForBrickOrRoute } = hooks!.checkPermissions!;

const consoleError = jest.spyOn(console, "error");
const consoleInfo = jest.spyOn(console, "info");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

customElements.define(
  "my-use-brick",
  class MyUseBrick extends HTMLElement {
    #mountResult: __secret_internals.MountUseBrickResult | undefined;
    #renderResult: __secret_internals.RenderUseBrickResult | undefined;
    async connectedCallback() {
      const div = document.createElement("div");
      this.#renderResult = await __secret_internals.renderUseBrick(
        {
          brick: "div",
          children: [
            {
              brick: "em",
              properties: {
                textContent: "Main in useBrick",
              },
            },
            {
              brick: "dialog",
              properties: {
                textContent: "Portal in useBrick",
              },
              portal: true,
            },
          ],
        },
        null
      );
      this.#mountResult = __secret_internals.mountUseBrick(
        this.#renderResult,
        div
      );
    }
    disconnectedCallback() {
      if (this.#mountResult && this.#renderResult) {
        __secret_internals.unmountUseBrick(
          this.#renderResult,
          this.#mountResult
        );
      }
    }
  }
);

const formRendererBricks = [
  "eo-micro-view",
  "basic-bricks.micro-view",
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
    const route = {
      path: "${APP.homepage}/:objectId",
      context: [{ name: "objectId", value: "<% PATH.objectId %>" }],
      bricks: [{ brick: "div" }],
      menu: {
        menuId: "my-menu",
      },
      preLoadBricks: ["my-pre-load-brick"],
    } as RouteConfOfBricks;
    const output = await renderRoutes(
      renderRoot,
      [route],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: {},
        request: expect.any(Promise),
      },
      route,
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
      }),
      path: "/home/:objectId",
    });
    expect(preCheckPermissionsForBrickOrRoute).toBeCalledTimes(2);
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      1,
      route,
      expect.any(Function)
    );
    expect(preCheckPermissionsForBrickOrRoute);
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      2,
      route.bricks[0],
      expect.any(Function)
    );
    expect(runtimeContext.pendingPermissionsPreCheck.length).toBe(2);
    expect(loadBricksImperatively).toBeCalledWith(["my-pre-load-brick"], []);
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
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: {},
      },
      route,
      redirect: { path: "/home/HOST/list" },
      path: "/home/:objectId",
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
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: {},
      },
      route,
      redirect: { path: "/outside" },
      path: "/home/:objectId",
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
      renderRoutes(null!, [route], runtimeContext, rendererContext, [], {})
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
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: expect.any(Object),
      },
      route: route.routes[0],
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
      }),
      path: "/home/:objectId/list",
    });
    expect(preCheckPermissionsForBrickOrRoute).toBeCalledTimes(3);
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      1,
      route,
      expect.any(Function)
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      2,
      route.routes[0],
      expect.any(Function)
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      3,
      brick,
      expect.any(Function)
    );
    expect(runtimeContext.pendingPermissionsPreCheck.length).toBe(3);
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("objectId")).toBe("HOST");
  });

  test("sub-routes in brick", async () => {
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
      flags: {},
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const brick = { brick: "div" };
    const subRoute: RouteConf = {
      path: "${APP.homepage}/:objectId/list",
      exact: true,
      bricks: [brick],
    };
    const route: RouteConf = {
      path: "${APP.homepage}/:objectId",
      exact: false,
      context: [{ name: "objectId", value: "<% PATH.objectId %>" }],
      bricks: [
        {
          brick: "div",
          slots: {
            "": {
              type: "routes",
              routes: [subRoute],
            },
          },
        },
      ],
    };
    const output = await renderRoutes(
      renderRoot,
      [route],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: {},
        child: expect.any(Object),
      },
      route: subRoute,
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
      }),
      path: "/home/:objectId/list",
    });
    expect(preCheckPermissionsForBrickOrRoute).toBeCalledTimes(4);
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      1,
      route,
      expect.any(Function)
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      2,
      route.bricks[0],
      expect.any(Function)
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      3,
      subRoute,
      expect.any(Function)
    );
    expect(preCheckPermissionsForBrickOrRoute).toHaveBeenNthCalledWith(
      4,
      brick,
      expect.any(Function)
    );
    expect(runtimeContext.pendingPermissionsPreCheck.length).toBe(4);
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
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: {},
      },
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
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: {},
      },
      unauthenticated: true,
    });
  });

  test("empty routes", async () => {
    const output = await renderRoutes(null!, [], null!, null!, [], {});
    expect(output).toEqual({
      blockingList: [],
      menuRequestNode: {
        return: {},
      },
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
    const rendererContext = new RendererContext("page");
    const ctxStore = new DataStore("CTX", undefined, rendererContext);
    const runtimeContext = {
      ctxStore,
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "triggerOnPageLoad",
          value: "unresolved",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "resolved"],
            lazy: true,
            trigger: "onPageLoad",
          },
        },
        {
          name: "triggerOnPageLoad2",
          value: "unresolved2",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "resolved2"],
            lazy: true,
            trigger: "onPageLoad",
          },
        },
      ],
      runtimeContext
    );
    const output = await renderBrick(
      renderRoot,
      {
        brick: "test.my-brick",
        lifeCycle: {
          onBeforePageLoad: {
            action: "console.info",
            args: ["onBeforePageLoad", "<% EVENT.type %>"],
          },
          onPageLoad: [
            {
              action: "console.info",
              args: ["onPageLoad", "<% EVENT.type %>"],
            },
          ],
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
          onMessage: {
            channel: "my-channel",
            handlers: {
              action: "console.info",
              args: ["onMessage", "<% EVENT.type %>"],
            },
          },
          onMessageClose: [
            {
              action: "console.info",
              args: ["onMessageClose", "<% EVENT.type %>"],
            },
            {
              action: "console.info",
              args: ["PROCESSORS.def.rst", "<% PROCESSORS.def.rst('opq') %>"],
            },
          ],
        },
        slots: {
          a: {
            bricks: [
              {
                brick: "div",
                events: {
                  click: {
                    action: "console.info",
                    args: ["<% PROCESSORS.abc.xyz() %>"],
                  },
                },
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
      rendererContext,
      [],
      {}
    );
    expect(output.blockingList.length).toBe(3);
    expect(enqueueStableLoadBricks).toBeCalledWith(["test.my-brick"], []);
    expect(loadProcessorsImperatively).toBeCalledTimes(2);
    expect(loadProcessorsImperatively).toHaveBeenNthCalledWith(
      1,
      new Set(["def.rst"]),
      []
    );
    expect(loadProcessorsImperatively).toHaveBeenNthCalledWith(
      2,
      new Set(["abc.xyz"]),
      []
    );
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

    // The trigger ctx is not resolved yet
    expect(ctxStore.getValue("triggerOnPageLoad")).toBe("unresolved");
    expect(ctxStore.getValue("triggerOnPageLoad2")).toBe("unresolved2");
    await (global as any).flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 100));
    // The trigger ctx is resolved now
    expect(ctxStore.getValue("triggerOnPageLoad")).toBe("resolved");
    expect(ctxStore.getValue("triggerOnPageLoad2")).toBe("resolved2");

    rendererContext.initializeMessageDispatcher();
    await (global as any).flushPromises();
    expect(consoleInfo).toHaveBeenNthCalledWith(
      11,
      "onMessage",
      "message.push"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      12,
      "onMessageClose",
      "message.close"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      13,
      "PROCESSORS.def.rst",
      "received: opq"
    );

    rendererContext.dispose();
    expect(consoleInfo).toBeCalledTimes(13);
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
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
    });
    expect(runtimeContext.pendingPermissionsPreCheck.length).toBe(1);
  });

  test("Legacy template", async () => {
    consoleError.mockReturnValueOnce();
    const brick: any = {
      template: "legacy-template",
    };
    const output = await renderBrick(null!, brick, null!, null!, [], {});
    expect(output).toEqual({
      blockingList: [],
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
    const output = await renderBrick(null!, brick, null!, null!, [], {});
    expect(output).toEqual({
      blockingList: [],
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
                title: "<% INDEX %>",
              },
            },
          ],
        },
        runtimeContext,
        rendererContext,
        [],
        {}
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
        rendererContext,
        [],
        {}
      ),
    ]);
    expect(output1).toEqual({
      blockingList: [],
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "div",
        properties: {
          textContent: "a",
          title: 0,
        },
        slotId: undefined,
        sibling: expect.objectContaining({
          tag: RenderTag.BRICK,
          return: renderRoot,
          type: "div",
          properties: {
            textContent: "b",
            title: 1,
          },
          slotId: undefined,
        }),
      }),
    });
    expect(output2).toEqual({
      node: {
        tag: RenderTag.PLACEHOLDER,
        return: {
          tag: RenderTag.ROOT,
        },
      },
      blockingList: [],
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
          dataSource: "<%= CTX.list %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% ITEM %>",
                title: "<% INDEX %>",
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
          lifeCycle: {
            onMount: {
              action: "console.info",
              args: [":forEach mount", "<% EVENT.detail.rerender %>"],
            },
            onUnmount: {
              action: "console.info",
              args: [":forEach unmount"],
            },
          },
        },
      ],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    renderRoot.child = output.node;
    await Promise.all([...output.blockingList, ctxStore.waitForAll()]);
    mountTree(renderRoot);
    expect(consoleInfo).not.toBeCalled();
    rendererContext.dispatchOnMount();
    rendererContext.initializeScrollIntoView();
    expect(consoleInfo).toBeCalledTimes(3);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "onMount", "mount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "onMount", "mount", "b");
    expect(consoleInfo).toHaveBeenNthCalledWith(3, ":forEach mount", false);

    expect(container.innerHTML).toBe(
      '<div title="0">a</div><div title="1">b</div>'
    );
    expect(portal.innerHTML).toBe("<p>portal:a</p><p>portal:b</p>");

    (container.firstChild as HTMLElement).title = "mark";
    expect(container.innerHTML).toBe(
      '<div title="mark">a</div><div title="1">b</div>'
    );

    ctxStore.updateValue("list", ["a", "c"], "replace");
    expect(consoleInfo).toBeCalledTimes(3);
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleInfo).toBeCalledTimes(9);
    expect(consoleInfo).toHaveBeenNthCalledWith(4, ":forEach unmount");
    expect(consoleInfo).toHaveBeenNthCalledWith(5, "onUnmount", "unmount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "onUnmount", "unmount", "b");
    expect(consoleInfo).toHaveBeenNthCalledWith(7, "onMount", "mount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(8, "onMount", "mount", "c");
    expect(consoleInfo).toHaveBeenNthCalledWith(9, ":forEach mount", true);

    // Note: previous `title="mark"` is removed
    expect(container.innerHTML).toBe(
      '<div title="0">a</div><div title="1">c</div>'
    );
    expect(portal.innerHTML).toBe("<p>portal:a</p><p>portal:c</p>");

    unmountTree(container);
    unmountTree(portal);
    rendererContext.dispatchOnUnmount();
    rendererContext.dispose();

    expect(consoleInfo).toBeCalledTimes(12);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      10,
      "onUnmount",
      "unmount",
      "a"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      11,
      "onUnmount",
      "unmount",
      "c"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(12, ":forEach unmount");

    consoleInfo.mockReset();
  });

  test(":forEach and track with empty initial", async () => {
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
            args: [100, null],
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
          brick: "h1",
          properties: {
            textContent: "Before",
          },
        },
        {
          brick: "hr",
          portal: true,
        },
        {
          brick: ":forEach",
          dataSource: "<%= CTX.list %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% ITEM %>",
                title: "<% INDEX %>",
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
          lifeCycle: {
            onMount: {
              action: "console.info",
              args: [":forEach mount", "<% EVENT.detail.rerender %>"],
            },
            onUnmount: {
              action: "console.info",
              args: [":forEach unmount"],
            },
          },
        },
        {
          brick: "h2",
          properties: {
            textContent: "After",
          },
        },
        {
          brick: "br",
          portal: true,
        },
      ],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    renderRoot.child = output.node;
    await Promise.all([...output.blockingList, ctxStore.waitForAll()]);
    mountTree(renderRoot);
    expect(consoleInfo).not.toBeCalled();
    rendererContext.dispatchOnMount();
    rendererContext.initializeScrollIntoView();
    expect(consoleInfo).toBeCalledTimes(1);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, ":forEach mount", false);

    expect(container.innerHTML).toBe("<h1>Before</h1><h2>After</h2>");
    expect(portal.innerHTML).toBe("<hr><br>");

    ctxStore.updateValue("list", ["a", "c"], "replace");
    expect(consoleInfo).toBeCalledTimes(1);
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleInfo).toBeCalledTimes(5);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, ":forEach unmount");
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "onMount", "mount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "onMount", "mount", "c");
    expect(consoleInfo).toHaveBeenNthCalledWith(5, ":forEach mount", true);

    expect(container.innerHTML).toBe(
      '<h1>Before</h1><div title="0">a</div><div title="1">c</div><h2>After</h2>'
    );
    expect(portal.innerHTML).toBe("<hr><p>portal:a</p><p>portal:c</p><br>");

    unmountTree(container);
    unmountTree(portal);
    rendererContext.dispatchOnUnmount();
    rendererContext.dispose();

    expect(consoleInfo).toBeCalledTimes(8);
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "onUnmount", "unmount", "a");
    expect(consoleInfo).toHaveBeenNthCalledWith(7, "onUnmount", "unmount", "c");
    expect(consoleInfo).toHaveBeenNthCalledWith(8, ":forEach unmount");

    consoleInfo.mockReset();
  });

  test("nesting :forEach and track", async () => {
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
          name: "value",
          value: 1,
        },
        {
          name: "constant",
        },
      ],
      runtimeContext
    );
    const rendererContext = new RendererContext("page");
    const output = await renderBricks(
      renderRoot,
      [
        {
          brick: "h1",
          properties: {
            textContent: "Hello",
          },
        },
        {
          brick: ":forEach",
          dataSource: "<%= [CTX.constant] %>",
          children: [
            {
              brick: "p",
              properties: {
                textContent: "prefix",
              },
            },
            {
              brick: ":forEach",
              dataSource: "<%= [CTX.value] %>",
              children: [
                {
                  brick: "p",
                  properties: {
                    textContent: "<% `ForEach in ForEach [${ITEM}]` %>",
                  },
                },
              ],
            },
            {
              brick: "p",
              properties: {
                textContent: "suffix",
              },
            },
          ],
        },
        {
          brick: "p",
          properties: {
            textContent: "Goodbye",
          },
        },
      ],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    renderRoot.child = output.node;
    await Promise.all([...output.blockingList, ctxStore.waitForAll()]);
    mountTree(renderRoot);

    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <h1>
          Hello
        </h1>,
        <p>
          prefix
        </p>,
        <p>
          ForEach in ForEach [1]
        </p>,
        <p>
          suffix
        </p>,
        <p>
          Goodbye
        </p>,
      ]
    `);

    ctxStore.updateValue("value", 2, "replace");
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <h1>
          Hello
        </h1>,
        <p>
          prefix
        </p>,
        <p>
          ForEach in ForEach [2]
        </p>,
        <p>
          suffix
        </p>,
        <p>
          Goodbye
        </p>,
      ]
    `);

    unmountTree(container);
    unmountTree(portal);
    rendererContext.dispose();
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
        rendererContext,
        [],
        {}
      ),
      renderBrick(
        renderRoot,
        {
          brick: ":if",
          dataSource: "<% CTX.quality !== 'good' %>",
          slots,
        },
        runtimeContext,
        rendererContext,
        [],
        {}
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
        rendererContext,
        [],
        {}
      ),
    ]);
    expect(output1).toEqual({
      blockingList: [],
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
      node: {
        tag: RenderTag.PLACEHOLDER,
        return: {
          tag: RenderTag.ROOT,
        },
      },
      blockingList: [],
    });
  });

  test(":if and track with empty initial and no next siblings", async () => {
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
          name: "quality",
          value: "good",
        },
      ],
      runtimeContext
    );
    const rendererContext = new RendererContext("page");
    const output = await renderBricks(
      renderRoot,
      [
        {
          brick: "h1",
          properties: {
            textContent: "Before",
          },
        },
        {
          iid: "if-a",
          brick: ":if",
          dataSource: "<%= CTX.quality === 'bad' %>",
          children: [
            {
              brick: "h2",
              properties: {
                textContent: "Warning",
              },
            },
          ],
        },
        {
          iid: "if:b",
          brick: ":if",
          dataSource: "<%= CTX.quality === 'bad' %>",
          children: [
            {
              brick: "p",
              properties: {
                textContent: "Not good",
              },
            },
          ],
        },
      ],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    renderRoot.child = output.node;
    await Promise.all([...output.blockingList, ctxStore.waitForAll()]);
    mountTree(renderRoot);
    rendererContext.dispatchOnMount();
    rendererContext.initializeScrollIntoView();

    expect(container.innerHTML).toBe("<h1>Before</h1>");

    // Scenario: two empty renders in a row with two control nodes
    ctxStore.updateValue("quality", "better", "replace");
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.innerHTML).toBe("<h1>Before</h1>");

    ctxStore.updateValue("quality", "bad", "replace");
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.innerHTML).toBe(
      "<h1>Before</h1><h2>Warning</h2><p>Not good</p>"
    );

    unmountTree(container);
    unmountTree(portal);
    rendererContext.dispatchOnUnmount();
    rendererContext.dispose();
  });

  test("re-render dynamic nodes with portal bricks from useBrick", async () => {
    const container = document.createElement("div");
    const portal = document.createElement("div");
    portal.id = "portal-mount-point";
    document.body.append(container, portal);
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
          value: ["A"],
        },
      ],
      runtimeContext
    );
    const rendererContext = new RendererContext("page");
    const output = await renderBricks(
      renderRoot,
      [
        {
          brick: "h1",
          properties: {
            textContent: "Main",
          },
        },
        {
          brick: "p",
          properties: {
            textContent: "Portal",
          },
          portal: true,
        },
        {
          brick: ":forEach",
          dataSource: "<%= CTX.list %>",
          children: [
            {
              brick: "strong",
              properties: {
                textContent: "<% `Title: ${ITEM}` %>",
              },
              portal: true,
            },
          ],
        },
        {
          brick: ":forEach",
          dataSource: "<%= CTX.list %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% `Main: ${ITEM}` %>",
              },
              children: [
                {
                  brick: "dialog",
                  properties: {
                    textContent: "<% `Portal: ${ITEM}` %>",
                  },
                  portal: true,
                },
              ],
            },
            {
              brick: "my-use-brick",
            },
          ],
        },
      ],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    renderRoot.child = output.node;
    await Promise.all([...output.blockingList, ctxStore.waitForAll()]);
    mountTree(renderRoot);
    rendererContext.dispatchOnMount();
    rendererContext.initializeScrollIntoView();

    expect(container.innerHTML).toBe(
      "<h1>Main</h1><div>Main: A</div><my-use-brick></my-use-brick>"
    );
    expect(portal.innerHTML).toBe(
      "<p>Portal</p><strong>Title: A</strong><dialog>Portal: A</dialog>"
    );

    // Wait for useBrick
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(portal.innerHTML).toBe(
      "<p>Portal</p><strong>Title: A</strong><dialog>Portal: A</dialog><div><dialog>Portal in useBrick</dialog></div>"
    );

    // Scenario: Re-render dynamic nodes with portal bricks from useBrick.
    ctxStore.updateValue("list", ["B"], "replace");
    // Wait for `_.debounce()`
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.innerHTML).toBe(
      "<h1>Main</h1><div>Main: B</div><my-use-brick></my-use-brick>"
    );
    expect(portal.innerHTML).toBe(
      "<p>Portal</p><strong>Title: B</strong><dialog>Portal: B</dialog><div><dialog>Portal in useBrick</dialog></div>"
    );

    unmountTree(container);
    unmountTree(portal);
    rendererContext.dispatchOnUnmount();
    rendererContext.dispose();
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
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
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
        rendererContext,
        [],
        {}
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
          willNotSet: {
            ref: "sp",
            refProperty: "title",
          },
          willBeUndefined: {
            ref: "sp",
            refProperty: "oops",
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
          willBeUndefined: "<% undefined %>",
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
      rendererContext,
      [],
      {}
    );
    renderRoot.child = output.node;
    const { tplStateStoreId } = (output.node as RenderBrick)!.tplHostMetadata!;
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
        <my.tpl-a
          data-tpl-state-store-id="tpl-state-1"
        >
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
      [__secret_internals.symbolForRootRuntimeContext]: expect.any(Object),
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
          dataSource: "<%= STATE.list %>",
          children: [
            {
              brick: "div",
              properties: {
                textContent: "<% ITEM %>",
                title: "<% INDEX %>",
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
      [],
      {}
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
        <my.tpl-b
          data-tpl-state-store-id="tpl-state-2"
        >
          <div
            title="0"
          >
            a
          </div>
          <div
            title="1"
          >
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
        <my.tpl-b
          data-tpl-state-store-id="tpl-state-2"
        >
          <div
            title="mark"
          >
            a
          </div>
          <div
            title="1"
          >
            b
          </div>
        </my.tpl-b>,
      ]
    `);

    const stateStore = getTplStateStore(
      {
        tplStateStoreId: (output.node as RenderBrick)?.tplHostMetadata
          ?.tplStateStoreId,
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
        <my.tpl-b
          data-tpl-state-store-id="tpl-state-2"
        >
          <div
            title="0"
          >
            a
          </div>
          <div
            title="1"
          >
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
      rendererContext,
      [],
      {}
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
        <my.tpl-c
          data-tpl-state-store-id="tpl-state-3"
        >
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
        <my.tpl-c
          data-tpl-state-store-id="tpl-state-4"
        >
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

  test("nesting tpl with inner :forEach", async () => {
    consoleInfo.mockReturnValue();

    customTemplates.define("my.tpl-e", {
      bricks: [
        {
          brick: "my.tpl-f",
          children: [
            {
              brick: ":forEach",
              dataSource: [1, 2],
              children: [
                {
                  brick: "div",
                  properties: {
                    textContent: "<% ITEM %>",
                    title: "<% INDEX %>",
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
        },
      ],
    });

    customTemplates.define("my.tpl-f", {
      proxy: {
        slots: {
          "": {
            ref: "div",
          },
        },
      },
      bricks: [
        {
          brick: "div",
          ref: "div",
          properties: {
            title: "Nesting templates with :forEach",
          },
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
      [{ brick: "my.tpl-e" }],
      runtimeContext,
      rendererContext,
      [],
      {}
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
        <my.tpl-e
          data-tpl-state-store-id="tpl-state-5"
        >
          <my.tpl-f
            data-tpl-state-store-id="tpl-state-6"
          >
            <div
              title="Nesting templates with :forEach"
            >
              <div
                title="0"
              >
                1
              </div>
              <div
                title="1"
              >
                2
              </div>
            </div>
          </my.tpl-f>
        </my.tpl-e>,
      ]
    `);
    expect(portal.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <p>
          portal:1
        </p>,
        <p>
          portal:2
        </p>,
      ]
    `);
  });

  test("nesting tpl with inner and outer :forEach", async () => {
    consoleInfo.mockReturnValue();

    customTemplates.define("my.tpl-g", {
      bricks: [
        {
          brick: "my.tpl-h",
          children: [
            {
              brick: ":forEach",
              dataSource: [1, 2],
              children: [
                {
                  brick: "div",
                  properties: {
                    textContent: "<% ITEM %>",
                    title: "<% INDEX %>",
                  },
                },
                {
                  brick: "p",
                  properties: {
                    textContent: "<% `p:${ITEM}` %>",
                  },
                },
              ],
            },
            {
              brick: ":forEach",
              slot: "article",
              dataSource: [3, 4],
              children: [
                {
                  brick: "em",
                  properties: {
                    textContent: "<% `outer:${ITEM}` %>",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    customTemplates.define("my.tpl-h", {
      proxy: {
        slots: {
          "": {
            ref: "div",
          },
          article: {
            ref: "article",
            refSlot: "",
          },
        },
      },
      bricks: [
        {
          brick: "div",
          ref: "div",
          properties: {
            title: "Nesting templates with :forEach",
          },
        },
        {
          brick: ":forEach",
          dataSource: ["x"],
          children: [
            {
              brick: "h2",
              properties: {
                textContent: "<% ITEM %>",
              },
            },
            {
              brick: "article",
              ref: "article",
            },
            {
              brick: "aside",
              properties: {
                textContent: "<% INDEX %>",
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
      formStateStoreMap: new Map(),
      pendingPermissionsPreCheck: [] as undefined[],
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const output = await renderBricks(
      renderRoot,
      [{ brick: "my.tpl-g" }],
      runtimeContext,
      rendererContext,
      [],
      {}
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
        <my.tpl-g
          data-tpl-state-store-id="tpl-state-7"
        >
          <my.tpl-h
            data-tpl-state-store-id="tpl-state-8"
          >
            <div
              title="Nesting templates with :forEach"
            >
              <div
                title="0"
              >
                1
              </div>
              <p>
                p:1
              </p>
              <div
                title="1"
              >
                2
              </div>
              <p>
                p:2
              </p>
            </div>
            <h2>
              x
            </h2>
            <article>
              <em>
                outer:3
              </em>
              <em>
                outer:4
              </em>
            </article>
            <aside>
              0
            </aside>
          </my.tpl-h>
        </my.tpl-g>,
      ]
    `);
  });

  test("sub-routes with template", async () => {
    customTemplates.define("my.tpl-i", {
      proxy: {
        slots: {
          "": {
            ref: "div",
          },
        },
      },
      bricks: [
        {
          brick: "div",
          ref: "div",
        },
      ],
    });
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
      flags: {},
      tplStateStoreMap: new Map(),
    } as RuntimeContext;
    const rendererContext = new RendererContext("page");
    const brick = { brick: "div" };
    const subRoute: RouteConf = {
      path: "${APP.homepage}/:objectId/list",
      exact: true,
      bricks: [brick],
    };
    const route: RouteConf = {
      path: "${APP.homepage}/:objectId",
      exact: false,
      context: [{ name: "objectId", value: "<% PATH.objectId %>" }],
      bricks: [
        {
          brick: "my.tpl-i",
          children: [
            {
              brick: "div",
              slots: {
                "": {
                  type: "routes",
                  routes: [
                    subRoute,
                    {
                      type: "redirect",
                      path: "${APP.homepage}/:objectId/redirect",
                      redirect: "/other",
                    },
                    {
                      type: "routes",
                      path: "${APP.homepage}/:objectId/routes",
                      routes: [],
                    },
                    {
                      path: "${APP.homepage}/bricks",
                      type: "bricks",
                      bricks: [],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    };
    const output = await renderRoutes(
      renderRoot,
      [route],
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    expect(output).toMatchObject({
      blockingList: [],
      route: subRoute,
      node: expect.objectContaining({
        tag: RenderTag.BRICK,
        return: renderRoot,
        type: "my.tpl-i",
      }),
      path: "/home/:objectId/list",
    });
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("objectId")).toBe("HOST");
  });

  test("tpl with inner :forEach", async () => {
    customTemplates.define("my.tpl-d", {
      proxy: {
        slots: {
          "": {
            ref: "forEach",
          },
        },
      },
      bricks: [
        {
          brick: "div",
          properties: {
            textContent: "Hi",
          },
        },
        {
          brick: ":forEach",
          dataSource: [1, 2],
          ref: "forEach",
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

    consoleError.mockReturnValue();
    const promise1 = renderBrick(
      renderRoot,
      {
        brick: "my.tpl-d",
        children: [
          {
            brick: "p",
            properties: {
              title: "<% 1, ITEM %>",
            },
            children: [
              {
                brick: "em",
                properties: {
                  textContent: "oops",
                },
              },
            ],
          },
        ],
      },
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    await expect(promise1).rejects.toThrowErrorMatchingInlineSnapshot(
      `"ITEM is not defined, in "<% 1, ITEM %>""`
    );
    expect(consoleError).toBeCalledTimes(2);

    const promise2 = renderBrick(
      renderRoot,
      {
        brick: "my.tpl-d",
        children: [
          {
            brick: "p",
            properties: {
              title: "yaks",
            },
            children: [
              {
                brick: "em",
                properties: {
                  textContent: "<% 2, ITEM %>",
                },
              },
            ],
          },
        ],
      },
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    await expect(promise2).rejects.toThrowErrorMatchingInlineSnapshot(
      `"ITEM is not defined, in "<% 2, ITEM %>""`
    );
    expect(consoleError).toBeCalledTimes(4);
    consoleError.mockRestore();
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
      rendererContext,
      [],
      {}
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
        brick: "forms.general-form",
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
      rendererContext,
      [],
      {}
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
          <eo-micro-view
            style="padding: 12px;"
          >
            <forms.general-form>
              <forms.general-input
                data-testid="string"
                id="string"
              />
            </forms.general-form>
          </eo-micro-view>
        </form-renderer.form-renderer>,
      ]
    `);
  });
});

describe("renderBrick for scripts", () => {
  test("script with src", async () => {
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
        brick: "script",
        properties: {
          src: "http://example.com/a.js",
          type: "module",
        },
      },
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({ blockingList: [] });
    expect(loadScript).toBeCalledTimes(1);
    expect(loadScript).toBeCalledWith("http://example.com/a.js", "", {
      type: "module",
    });
  });

  test("script without src", async () => {
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
        brick: "script",
        properties: {
          text: "console.log(1)",
        },
      },
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      node: expect.objectContaining({
        type: "script",
        properties: {
          text: "console.log(1)",
        },
      }),
    });
    expect(loadScript).toBeCalledTimes(0);
  });
});

describe("renderBrick for stylesheets", () => {
  test("stylesheet with src", async () => {
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
        brick: "link",
        properties: {
          rel: "stylesheet",
          href: "http://example.com/b.css",
        },
      },
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({ blockingList: [] });
    expect(loadStyle).toBeCalledTimes(1);
    expect(loadStyle).toBeCalledWith("http://example.com/b.css", "", {
      rel: "stylesheet",
    });
  });

  test("stylesheet with rel other than stylesheet", async () => {
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
        brick: "link",
        properties: {
          rel: "prefetch",
          href: "http://example.com/b.css",
        },
      },
      runtimeContext,
      rendererContext,
      [],
      {}
    );
    expect(output).toEqual({
      blockingList: [],
      node: expect.objectContaining({
        type: "link",
        properties: {
          rel: "prefetch",
          href: "http://example.com/b.css",
        },
      }),
    });
    expect(loadStyle).toBeCalledTimes(0);
  });
});
