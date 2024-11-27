import { jest, describe, test, expect } from "@jest/globals";
import type { BrickPackage, UseSingleBrickConf } from "@next-core/types";
import { createProviderClass } from "@next-core/utils/general";
import {
  RuntimeContext,
  getAllContextValues,
  getContextValue,
  legacyDoTransform,
  mountUseBrick,
  renderUseBrick,
  unmountUseBrick,
  updateStoryboard,
  updateStoryboardByRoute,
  updateStoryboardBySnippet,
  updateStoryboardByTemplate,
  getBrickPackagesById,
  getRenderId,
  getAddedContracts,
  symbolForRootRuntimeContext,
  debugDataValue,
  getLegalRuntimeValue,
} from "./secret_internals.js";
import { mediaEventTarget } from "./mediaQuery.js";
import { customTemplates } from "../CustomTemplates.js";
import { isStrictMode, warnAboutStrictMode } from "../isStrictMode.js";
import {
  _test_only_setBootstrapData,
  _internalApiGetRuntimeContext,
  _internalApiGetStoryboardInBootstrapData,
} from "./Runtime.js";
import { DataStore } from "./data/DataStore.js";
import * as resolveData from "./data/resolveData.js";
import * as computeRealValue from "./compute/computeRealValue.js";
import * as routeMatchedMap from "./routeMatchedMap.js";

jest.mock("@next-core/loader");
jest.mock("../isStrictMode.js");
jest.mock("./Runtime.js", () => {
  const originalModule = jest.requireActual("./Runtime.js") as any;

  return {
    __esModule: true,
    ...originalModule,
    _internalApiGetRuntimeContext: jest.fn(),
  };
});
const mockInternalApiGetRuntimeContext =
  _internalApiGetRuntimeContext as jest.MockedFunction<
    typeof _internalApiGetRuntimeContext
  >;

const consoleInfo = jest.spyOn(console, "info");
const mockIsStrictMode = (
  isStrictMode as jest.MockedFunction<typeof isStrictMode>
).mockReturnValue(false);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IntersectionObserver = jest.fn((callback: Function) => {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
  };
});
(window as any).IntersectionObserver = IntersectionObserver;

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

describe("useBrick", () => {
  beforeEach(() => {
    const portal = document.createElement("div");
    portal.id = "portal-mount-point";
    document.body.appendChild(portal);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("general", async () => {
    consoleInfo.mockReturnValue();
    const useBrick: UseSingleBrickConf = {
      brick: "div",
      properties: {
        title: "<% `container:${DATA}` %>",
      },
      lifeCycle: {
        onMount: {
          action: "console.info",
          args: ["onMount", "<% EVENT.type %>", "<% DATA %>"],
        },
        onUnmount: {
          action: "console.info",
          args: ["onUnmount", "<% EVENT.type %>", "<% DATA %>"],
        },
      },
      children: [
        {
          brick: "span",
          properties: {
            textContent: "<% `child:${DATA}` %>",
          },
          lifeCycle: {
            onMediaChange: {
              action: "console.info",
              args: [
                "onMediaChange",
                "<% EVENT.type %>",
                "<% EVENT.detail %>",
                "<% DATA %>",
              ],
            },
            onScrollIntoView: {
              handlers: [
                {
                  action: "console.info",
                  args: ["onScrollIntoView", "<% EVENT.type %>", "<% DATA %>"],
                },
              ],
            },
          },
        },
        {
          brick: "p",
          properties: {
            textContent: "<% `portal:${DATA}` %>",
          },
          portal: true,
        },
      ],
    };

    const renderResult = await renderUseBrick(useBrick, "a");
    expect(renderResult.tagName).toBe("div");
    expect(consoleInfo).toBeCalledTimes(0);

    const root = document.createElement("div");
    const mountResult = mountUseBrick(renderResult, root);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "onMount", "mount", "a");

    expect(root).toMatchInlineSnapshot(`
      <div
        title="container:a"
      >
        <span>
          child:a
        </span>
      </div>
    `);
    expect(document.querySelector("#portal-mount-point")?.children)
      .toMatchInlineSnapshot(`
      HTMLCollection [
        <div>
          <p>
            portal:a
          </p>
        </div>,
      ]
    `);

    IntersectionObserver.mock.calls[0][0](
      [
        { isIntersecting: false },
        { isIntersecting: true, intersectionRatio: 0.05 },
        { isIntersecting: true, intersectionRatio: 0.1 },
      ],
      { disconnect: jest.fn() }
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "onScrollIntoView",
      "scroll.into.view",
      "a"
    );

    mediaEventTarget.dispatchEvent(
      new CustomEvent("change", { detail: { breakpoint: "large" } })
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      3,
      "onMediaChange",
      "media.change",
      { breakpoint: "large" },
      "a"
    );

    unmountUseBrick(renderResult, mountResult);
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "onUnmount", "unmount", "a");
    expect(document.querySelector("#portal-mount-point")?.innerHTML).toBe("");

    consoleInfo.mockReset();
  });

  test("strict mode with transform", async () => {
    mockIsStrictMode.mockReturnValue(true);
    const useBrick: any = {
      brick: "div",
      properties: {
        title: "<% `byProperties:${DATA}` %>",
      },
      transform: {
        title: "<% `byTransform:${DATA}` %>",
      },
      children: [
        {
          brick: "span",
          properties: {
            title: "<% `byProperties:${DATA}` %>",
            textContent: "<% `byProperties[text]:${DATA}` %>",
          },
          transform: {
            textContent: "<% `byTransform[text]:${DATA}` %>",
          },
        },
      ],
    };
    const renderResult = await renderUseBrick(useBrick, "ok");
    expect(warnAboutStrictMode).toHaveBeenNthCalledWith(
      1,
      true,
      "`useBrick.transform`",
      'please use "properties" instead, check your useBrick:',
      useBrick
    );
    expect(warnAboutStrictMode).toHaveBeenNthCalledWith(
      2,
      true,
      "`useBrick.transform`",
      'please use "properties" instead, check your useBrick:',
      useBrick.children[0]
    );
    expect(mockIsStrictMode).toBeCalled();

    const root = document.createElement("div");
    const mountResult = mountUseBrick(renderResult, root);
    expect(root).toMatchInlineSnapshot(`
      <div
        title="byProperties:ok"
      >
        <span
          title="byProperties:ok"
        >
          byProperties[text]:ok
        </span>
      </div>
    `);
    unmountUseBrick(renderResult, mountResult);
    mockIsStrictMode.mockReturnValue(false);
  });

  test("non-strict mode with transform", async () => {
    const useBrick: any = {
      brick: "div",
      properties: {
        title: "<% `byProperties:${DATA}` %>",
      },
      transform: {
        title: "<% `byTransform:${DATA}` %>",
      },
      children: [
        {
          brick: "span",
          properties: {
            title: "<% `byProperties:${DATA}` %>",
            textContent: "<% `byProperties[text]:${DATA}` %>",
          },
          transform: {
            textContent: "<% `byTransform[text]:${DATA}` %>",
          },
        },
      ],
    };
    const renderResult = await renderUseBrick(useBrick, "ok");
    expect(warnAboutStrictMode).toHaveBeenNthCalledWith(
      1,
      false,
      "`useBrick.transform`",
      'please use "properties" instead, check your useBrick:',
      useBrick
    );
    expect(warnAboutStrictMode).toHaveBeenNthCalledWith(
      2,
      false,
      "`useBrick.transform`",
      'please use "properties" instead, check your useBrick:',
      useBrick.children[0]
    );

    const root = document.createElement("div");
    const mountResult = mountUseBrick(renderResult, root);
    expect(root).toMatchInlineSnapshot(`
      <div
        title="byTransform:ok"
      >
        <span
          title="byProperties:ok"
        >
          byTransform[text]:ok
        </span>
      </div>
    `);
    unmountUseBrick(renderResult, mountResult);
  });

  test("if: alse", async () => {
    const useBrick: UseSingleBrickConf = {
      brick: "div",
      if: false,
    };
    const renderResult = await renderUseBrick(useBrick, "a");
    expect(renderResult.tagName).toBe(null);
  });

  test("tpl", async () => {
    mockInternalApiGetRuntimeContext.mockReturnValue({
      ctxStore: new DataStore("CTX"),
    } as RuntimeContext);
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
          },
          children: [
            {
              brick: ":if",
              dataSource: "<% 'track state', STATE.x === 'X2' %>",
              slots: {
                "": {
                  bricks: [
                    {
                      brick: "span",
                      ref: "sp",
                      properties: {
                        id: "inner-span",
                        textContent: "<% `I'm inner slot [${STATE.z}]` %>",
                      },
                    },
                    {
                      brick: "hr",
                      ref: "hr",
                    },
                  ],
                },
                else: {
                  bricks: [
                    {
                      brick: "span",
                      ref: "sp",
                      properties: {
                        id: "inner-span",
                        textContent:
                          "<% `I'm updated inner slot [${STATE.z}]` %>",
                      },
                    },
                  ],
                },
              },
            },
            {
              if: "<%= STATE.x === 'X2' %>",
              brick: "br",
            },
          ],
        },
      ],
    });

    const useBrick: UseSingleBrickConf = {
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
    };

    const renderResult = await renderUseBrick(useBrick, "a");
    expect(renderResult.tagName).toBe("my.tpl-a");

    const root = document.createElement("my.tpl-a");
    const mountResult = mountUseBrick(renderResult, root);

    expect(root).toMatchInlineSnapshot(`
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
          <hr />
          <br />
          <em
            slot="innerToolbar"
          >
            I'm outer toolbar
          </em>
        </div>
      </my.tpl-a>
    `);
    expect((root.firstChild as any).x).toBe("X2");
    expect((root.firstChild as any).y).toBe("Y");
    expect((root.firstChild as any).z).toBe("ResolvedZ");

    root.querySelector("#inner-span")!.dispatchEvent(new Event("spanClick"));
    expect(consoleInfo).toBeCalledTimes(1);
    expect(consoleInfo).toBeCalledWith("spanClick");

    (root as any).x = "X3";
    // Wait for debounced re-render for control nodes.
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(root).toMatchInlineSnapshot(`
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
            I'm updated inner slot [ResolvedZ]
          </span>
          <em
            slot="innerToolbar"
          >
            I'm outer toolbar
          </em>
        </div>
      </my.tpl-a>
    `);

    root.querySelector("#inner-span")!.dispatchEvent(new Event("spanClick"));
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toBeCalledWith("spanClick");

    unmountUseBrick(renderResult, mountResult);

    consoleInfo.mockReset();
    mockInternalApiGetRuntimeContext.mockReturnValue(undefined);
  });

  test("root as portal", async () => {
    const useBrick: UseSingleBrickConf = {
      brick: "div",
      portal: true,
    };
    await expect(renderUseBrick(useBrick, "a")).rejects.toMatchInlineSnapshot(
      `[Error: The root brick of useBrick cannot be a portal brick]`
    );
  });

  test("root as an ignored tracking control node", async () => {
    mockInternalApiGetRuntimeContext.mockReturnValue({
      ctxStore: new DataStore("CTX"),
    } as RuntimeContext);
    const useBrick: UseSingleBrickConf = {
      brick: ":if",
      dataSource: "<%= false && CTX.abc %>",
      children: [
        {
          brick: "div",
        },
      ],
    };
    await expect(renderUseBrick(useBrick, "a")).rejects.toMatchInlineSnapshot(
      `[Error: The root brick of useBrick cannot be an ignored tracking control node]`
    );
    mockInternalApiGetRuntimeContext.mockReturnValue(undefined);
  });

  test("root as an ignored non-tracking control node", async () => {
    mockInternalApiGetRuntimeContext.mockReturnValue({
      ctxStore: new DataStore("CTX"),
    } as RuntimeContext);
    const useBrick: UseSingleBrickConf = {
      brick: ":if",
      dataSource: "<% false && CTX.abc %>",
      children: [
        {
          brick: "div",
        },
      ],
    };
    expect(await renderUseBrick(useBrick, "a")).toMatchObject({
      tagName: null,
    });
    mockInternalApiGetRuntimeContext.mockReturnValue(undefined);
  });

  test("with root runtime context symbol", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as RuntimeContext;
    const useBrick: any = {
      brick: "div",
      properties: {
        title: "<% `${CTX.prop}:${DATA}` %>",
      },
      [symbolForRootRuntimeContext]: runtimeContext,
    };
    ctxStore.define([{ name: "prop", value: "Prop" }], runtimeContext);

    const renderResult = await renderUseBrick(useBrick, "ok");
    const root = document.createElement("div");
    const mountResult = mountUseBrick(renderResult, root);
    expect(root).toMatchInlineSnapshot(`
      <div
        title="Prop:ok"
      />
    `);
    unmountUseBrick(renderResult, mountResult);
  });
});

describe("legacyDoTransform", () => {
  test("should transform", () => {
    expect(legacyDoTransform({ quality: "good" }, "<% DATA.quality %>")).toBe(
      "good"
    );
  });

  test("should transform use placeholder", () => {
    expect(legacyDoTransform({ quality: "good" }, "q:@{quality}")).toBe(
      "q:good"
    );
  });

  test("should not inject", () => {
    expect(
      legacyDoTransform({ quality: "good" }, "q:@{quality},a:${oops}")
    ).toBe("q:good,a:${oops}");
  });

  test("should throw if passing options", () => {
    expect(() => {
      legacyDoTransform("good", "<% DATA %>", { allowInject: true });
    }).toThrowErrorMatchingInlineSnapshot(
      `"Legacy doTransform does not support options in v3"`
    );
  });
});

describe("updateStoryboard", () => {
  beforeEach(() => {
    _test_only_setBootstrapData({
      storyboards: [
        {
          app: {
            id: "hello",
          } as any,
          routes: [
            {
              path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
              exact: true,
              bricks: [],
            },
            {
              path: "${APP.homepage}",
              type: "routes",
              routes: [],
            },
            {
              path: "${APP.homepage}/about",
              bricks: [],
            },
            {
              path: "${APP.homepage}/sub-routes",
              bricks: [
                {
                  brick: "div",
                  slots: {
                    demo: {
                      bricks: [],
                    },
                    "": {
                      type: "routes",
                      routes: [
                        {
                          path: "${APP.homepage}/sub-routes",
                          exact: true,
                          bricks: [],
                        },
                        {
                          path: "${APP.homepage}/sub-routes/about",
                          exact: true,
                          type: "redirect",
                          redirect: "${APP.homepage}/about",
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  });

  afterEach(() => {
    _test_only_setBootstrapData(undefined!);
  });

  test("updateStoryboard", () => {
    updateStoryboard("hello", {
      routes: [
        {
          path: "${APP.homepage}",
          bricks: [],
        },
      ],
    });

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}",
          bricks: [],
        },
      ],
      meta: {},
      $$fulfilling: null,
      $$fulfilled: true,
      $$registerCustomTemplateProcessed: false,
    });
  });

  test("updateStoryboardByRoute", () => {
    updateStoryboardByRoute("hello", {
      path: "${APP.homepage}/about",
      bricks: [
        {
          brick: "div",
        },
      ],
    });

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          exact: true,
          bricks: [],
        },
        {
          path: "${APP.homepage}",
          type: "routes",
          routes: [],
        },
        {
          path: "${APP.homepage}/about",
          bricks: [
            {
              brick: "div",
            },
          ],
        },
        {
          path: "${APP.homepage}/sub-routes",
          bricks: expect.any(Array),
        },
      ],
    });
  });

  test("updateStoryboardByRoute with new route", () => {
    updateStoryboardByRoute("hello", {
      path: "${APP.homepage}/new",
      bricks: [
        {
          brick: "div",
        },
      ],
    });

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}/new",
          bricks: [
            {
              brick: "div",
            },
          ],
        },
        {
          path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          exact: true,
          bricks: [],
        },
        {
          path: "${APP.homepage}",
          type: "routes",
          routes: [],
        },
        {
          path: "${APP.homepage}/about",
          bricks: [],
        },
        {
          path: "${APP.homepage}/sub-routes",
          bricks: expect.any(Array),
        },
      ],
    });
  });

  test("updateStoryboardByRoute with route in bricks", () => {
    updateStoryboardByRoute("hello", {
      path: "${APP.homepage}/sub-routes",
      exact: true,
      bricks: [
        {
          brick: "div",
        },
      ],
    });

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          exact: true,
          bricks: [],
        },
        {
          path: "${APP.homepage}",
          type: "routes",
          routes: [],
        },
        {
          path: "${APP.homepage}/about",
          bricks: [],
        },
        {
          path: "${APP.homepage}/sub-routes",
          bricks: [
            {
              brick: "div",
              slots: {
                demo: {
                  bricks: [],
                },
                "": {
                  type: "routes",
                  routes: [
                    {
                      path: "${APP.homepage}/sub-routes",
                      exact: true,
                      bricks: [{ brick: "div" }],
                    },
                    {
                      path: "${APP.homepage}/sub-routes/about",
                      exact: true,
                      type: "redirect",
                      redirect: "${APP.homepage}/about",
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    });
  });

  test("updateStoryboardByTemplate", () => {
    updateStoryboardByTemplate(
      "hello",
      {
        name: "tpl-a",
        bricks: [
          {
            brick: "div",
          },
        ],
      },
      { properties: { quality: "good" } }
    );

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          exact: true,
          menu: false,
          bricks: [
            {
              brick: "tpl-a",
              properties: {
                quality: "good",
              },
            },
          ],
        },
        {
          path: "${APP.homepage}",
          type: "routes",
          routes: [],
        },
        {
          path: "${APP.homepage}/about",
          bricks: [],
        },
        {
          path: "${APP.homepage}/sub-routes",
          bricks: expect.any(Array),
        },
      ],
    });
  });

  test("updateStoryboardBySnippet", () => {
    updateStoryboardBySnippet("hello", {
      snippetId: "snippet-1",
      bricks: [
        {
          brick: "div",
        },
      ],
    });

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}/_dev_only_/snippet-preview/snippet-1",
          context: undefined,
          exact: true,
          menu: false,
          bricks: [{ brick: "div" }],
        },
        {
          path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          exact: true,
          bricks: [],
        },
        {
          path: "${APP.homepage}",
          type: "routes",
          routes: [],
        },
        {
          path: "${APP.homepage}/about",
          bricks: [],
        },
        {
          path: "${APP.homepage}/sub-routes",
          bricks: expect.any(Array),
        },
      ],
    });

    updateStoryboardBySnippet("hello", {
      snippetId: "snippet-2",
      bricks: [
        {
          brick: "div",
        },
      ],
      context: [
        {
          name: "test",
          value: "hello",
        },
      ],
    });

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}/_dev_only_/snippet-preview/snippet-2",
          context: [
            {
              name: "test",
              value: "hello",
            },
          ],
          exact: true,
          menu: false,
          bricks: [{ brick: "div" }],
        },
        {
          path: "${APP.homepage}/_dev_only_/snippet-preview/snippet-1",
          context: undefined,
          exact: true,
          menu: false,
          bricks: [{ brick: "div" }],
        },
        {
          path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          exact: true,
          bricks: [],
        },
        {
          path: "${APP.homepage}",
          type: "routes",
          routes: [],
        },
        {
          path: "${APP.homepage}/about",
          bricks: [],
        },
        {
          path: "${APP.homepage}/sub-routes",
          bricks: expect.any(Array),
        },
      ],
    });
  });

  test("updateStoryboardBySnippet with no bricks", () => {
    updateStoryboardBySnippet("hello", {
      snippetId: "snippet-1",
    });

    expect(_internalApiGetStoryboardInBootstrapData("hello")).toEqual({
      app: {
        id: "hello",
      },
      routes: [
        {
          path: "${APP.homepage}/_dev_only_/snippet-preview/snippet-1",
          context: undefined,
          exact: true,
          menu: false,
          bricks: [{ brick: "span" }],
        },
        {
          path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          exact: true,
          bricks: [],
        },
        {
          path: "${APP.homepage}",
          type: "routes",
          routes: [],
        },
        {
          path: "${APP.homepage}/about",
          bricks: [],
        },
        {
          path: "${APP.homepage}/sub-routes",
          bricks: expect.any(Array),
        },
      ],
    });
  });
});

describe("getContextValue", () => {
  let runtimeContext = {} as RuntimeContext;
  let stateStore: DataStore<"STATE">;
  let ctxStore: DataStore<"CTX">;

  beforeEach(async () => {
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const tplStateStoreId = "tpl-state-0";
    stateStore = new DataStore("STATE");
    tplStateStoreMap.set(tplStateStoreId, stateStore);
    ctxStore = new DataStore("CTX");

    runtimeContext = {
      tplStateStoreId,
      tplStateStoreMap,
      ctxStore,
    } as RuntimeContext;

    stateStore.define(
      [
        {
          name: "a",
          value: "1",
        },
        {
          name: "b",
          value: 2,
        },
      ],
      runtimeContext
    );
    ctxStore.define(
      [
        {
          name: "c",
          value: true,
        },
        {
          name: "d",
          value: false,
        },
      ],
      runtimeContext
    );
    await Promise.all([stateStore.waitForAll(), ctxStore.waitForAll()]);

    mockInternalApiGetRuntimeContext.mockReturnValue(runtimeContext);
  });

  afterEach(() => {
    mockInternalApiGetRuntimeContext.mockReturnValue(undefined);
  });

  test("get single context value", () => {
    expect(getContextValue("a", { tplStateStoreId: "tpl-state-0" })).toBe("1");
    expect(getContextValue("c", {})).toBe(true);
  });

  test("get all context value", () => {
    expect(getAllContextValues({ tplStateStoreId: "tpl-state-0" })).toEqual({
      a: "1",
      b: 2,
    });
    expect(getAllContextValues({})).toEqual({ c: true, d: false });
  });
});

describe("getBrickPackagesById", () => {
  beforeEach(() => {
    _test_only_setBootstrapData({
      brickPackages: [
        {
          id: "bricks/test",
        },
        {
          filePath: "bricks/v2-alt/index.jsw",
        },
        {
          filePath: "bricks/v2/index.jsw",
        },
      ] as unknown as BrickPackage[],
    });
  });

  test("found", () => {
    expect(getBrickPackagesById("bricks/test")).toMatchObject({
      id: "bricks/test",
    });
  });

  test("found v2", () => {
    expect(getBrickPackagesById("bricks/v2")).toMatchObject({
      filePath: "bricks/v2/index.jsw",
    });
  });

  test("found v2 alt", () => {
    expect(getBrickPackagesById("bricks/v2-alt")).toMatchObject({
      filePath: "bricks/v2-alt/index.jsw",
    });
  });

  test("not found", () => {
    expect(getBrickPackagesById("bricks/oops")).toBe(undefined);
  });
});

describe("getRenderId", () => {
  test("getRenderId", () => {
    expect(getRenderId()).toBe(undefined);
  });
});

describe("getAddedContracts", () => {
  beforeEach(() => {
    _test_only_setBootstrapData({
      storyboards: [
        {
          app: {
            id: "app-b",
          } as any,
          routes: [
            {
              alias: "/new",
              context: [
                {
                  name: "historyList",
                  resolve: {
                    args: [
                      {
                        page: "<% QUERY.page || 1 %>",
                        pageSize: "<% QUERY.pageSize || 20 %>",
                        userName: "<% SYS.username %>",
                      },
                    ],
                    useProvider: "easyops.api.micro_app.workflow@Get:1.0.0",
                  },
                },
              ],
              exact: true,
              iid: "5fd4e0de0e637",
              path: "${APP.homepage}/new",
              type: "bricks",
              bricks: [
                {
                  brick: "basic-bricks.general-modal",
                  iid: "5fdffa7f5d689",
                  portal: true,
                  properties: {
                    dataset: {
                      testid: "detail-modal",
                    },
                    id: "detail-modal",
                    modalTitle: "查看",
                    width: 700,
                  },
                },
              ],
            },
          ],
          meta: {
            contracts: [
              {
                name: "ViewTodo",
                namespaceId: "easyops.api.micro_app.workflow",
                version: "1.0.0",
              } as any,
            ],
          },
        },
      ],
    });
  });

  test("should work with route type", async () => {
    const storyboardPatch = {
      path: "${APP.homepage}/demo",
      alias: "/demo",
      exact: true,
      context: [
        {
          name: "appList",
          resolve: {
            args: [
              "APP",
              {
                fields: ["*"],
              },
            ],
            useProvider: "easyops.api.cmdb.instance@PostSearchV3:1.1.0",
          },
        },
      ],
      type: "bricks",
      bricks: [
        {
          brick: "span",
        },
      ],
    };

    expect(
      await getAddedContracts(storyboardPatch as any, {
        appId: "app-b",
        updateStoryboardType: "route",
        collectUsedContracts() {
          return ["easyops.api.cmdb.instance@PostSearchV3:1.1.0"];
        },
      })
    ).toEqual(["easyops.api.cmdb.instance@PostSearchV3:1.1.0"]);
  });

  test("should work with template type", async () => {
    const storyboardPatch = {
      name: "tpl-test-a",
      bricks: [
        {
          brick: "span",
        },
      ],
      state: [
        {
          name: "name",
          value: "easyops",
        },
        {
          name: "instanceData",
          resolve: {
            useProvider: "easyops.api.micro_app.workflow@ViewTodo:1.0.0",
          },
        },
      ],
    };

    expect(
      await getAddedContracts(storyboardPatch, {
        appId: "app-b",
        updateStoryboardType: "template",
        collectUsedContracts() {
          return ["easyops.api.micro_app.workflow@ViewTodo:1.0.0"];
        },
      })
    ).toEqual([]);
  });

  test("should work with snippet type", async () => {
    const storyboardPatch = {
      path: "${APP.homepage}/_dev_only_/snippet-preview/snippet-test",
      alias: "/snippet-test",
      exact: true,
      context: [
        {
          name: "workflow",
          resolve: {
            args: [
              "APP",
              {
                fields: ["*"],
              },
            ],
            useProvider: "easyops.api.micro_app.workflow@execute:1.0.0",
          },
        },
      ],
      type: "bricks",
      bricks: [
        {
          brick: "span",
        },
      ],
    };

    expect(
      await getAddedContracts(storyboardPatch as any, {
        appId: "app-b",
        updateStoryboardType: "snippet",
        collectUsedContracts() {
          return ["easyops.api.micro_app.workflow@execute:1.0.0"];
        },
      })
    ).toEqual(["easyops.api.micro_app.workflow@execute:1.0.0"]);
  });
});

describe("debugDataValue", () => {
  test("should work", async () => {
    const mockResolveData = jest
      .spyOn(resolveData, "resolveData")
      .mockImplementationOnce(async () => null);

    const mockAsyncComputeRealValue = jest
      .spyOn(computeRealValue, "asyncComputeRealValue")
      .mockImplementationOnce(async () => null);
    mockInternalApiGetRuntimeContext.mockReturnValue({} as any);
    await debugDataValue(
      {
        resolve: { useProvider: "easyops.api.cmdb.model@postSearch:1.0.0" },
      },
      { tplStateStoreId: "tpl-state-6" }
    );

    expect((mockResolveData as jest.Mock).mock.calls[0][0]).toEqual({
      useProvider: "easyops.api.cmdb.model@postSearch:1.0.0",
    });

    await debugDataValue(
      {
        value: "<% 1+ 1 %>",
      },
      { tplStateStoreId: undefined }
    );

    expect((mockAsyncComputeRealValue as jest.Mock).mock.calls[0][0]).toEqual(
      "<% 1+ 1 %>"
    );
    mockResolveData.mockRestore();
    mockAsyncComputeRealValue.mockRestore();
  });
});

describe("getLegalRuntimeValue", () => {
  const originLocation = window.location;

  window.location = {
    href: "https://dev-easyops.cn/home/Host",
    origin: "https://dev-easyops.cn",
    hostname: "admin.easyops.local",
    host: "admin.easyops.local",
  } as any;

  jest.spyOn(routeMatchedMap, "getMatchedRoute").mockReturnValueOnce({
    isExact: true,
    path: "/home/Host",
    url: "/home/Host",
    params: {
      instanceId: "b52c",
      projectId: "abc12",
    },
  });

  mockInternalApiGetRuntimeContext.mockReturnValue({
    app: {
      name: "home",
      id: "home",
      homepage: "/home",
      noAuthGuard: true,
    },
    query: {},
    sys: {
      org: 8888,
      username: "easyops",
    },
  } as unknown as RuntimeContext);

  expect(getLegalRuntimeValue()).toEqual({
    app: { homepage: "/home", id: "home", name: "home", noAuthGuard: true },
    location: {
      host: "localhost",
      hostname: "localhost",
      href: "http://localhost/",
      origin: "http://localhost",
    },
    match: {
      isExact: true,
      params: { instanceId: "b52c", projectId: "abc12" },
      path: "/home/Host",
      url: "/home/Host",
    },
    query: {},
    sys: { org: 8888, username: "easyops" },
  });
  window.location = originLocation;
});
