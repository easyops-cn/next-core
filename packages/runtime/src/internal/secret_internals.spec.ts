import { jest, describe, test, expect } from "@jest/globals";
import type { UseSingleBrickConf } from "@next-core/types";
import { createProviderClass } from "@next-core/utils/storyboard";
import {
  legacyDoTransform,
  mountUseBrick,
  renderUseBrick,
  unmountUseBrick,
  updateStoryboard,
  updateStoryboardByRoute,
  updateStoryboardBySnippet,
  updateStoryboardByTemplate,
} from "./secret_internals.js";
import { mediaEventTarget } from "./mediaQuery.js";
import { customTemplates } from "../CustomTemplates.js";
import { isStrictMode, warnAboutStrictMode } from "../isStrictMode.js";
import {
  _internalApiSetBootstrapData,
  _internalApiGetStoryboardInBootstrapData,
} from "./Runtime.js";

jest.mock("@next-core/loader");
jest.mock("../isStrictMode.js");
const consoleInfo = jest.spyOn(console, "info");
const mockIsStrictMode = (
  isStrictMode as jest.MockedFunction<typeof isStrictMode>
).mockReturnValue(false);

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
    mockIsStrictMode.mockReturnValueOnce(true);
    const useBrick: any = {
      brick: "div",
      properties: {
        title: "<% `byProperties:${DATA}` %>",
      },
      transform: {
        title: "<% `byTransform:${DATA}` %>",
      },
    };
    const renderResult = await renderUseBrick(useBrick, "ok");
    expect(warnAboutStrictMode).toBeCalledWith(
      true,
      "`useBrick.transform`",
      'please use "properties" instead, check your useBrick:',
      useBrick
    );
    expect(mockIsStrictMode).toBeCalled();

    const root = document.createElement("div");
    const mountResult = mountUseBrick(renderResult, root);
    expect(root).toMatchInlineSnapshot(`
      <div
        title="byProperties:ok"
      />
    `);
    unmountUseBrick(renderResult, mountResult);
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
    };
    const renderResult = await renderUseBrick(useBrick, "ok");
    expect(warnAboutStrictMode).toBeCalledWith(
      false,
      "`useBrick.transform`",
      'please use "properties" instead, check your useBrick:',
      useBrick
    );

    const root = document.createElement("div");
    const mountResult = mountUseBrick(renderResult, root);
    expect(root).toMatchInlineSnapshot(`
      <div
        title="byTransform:ok"
      />
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
          <hr />
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
    _internalApiSetBootstrapData({
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
          ],
        },
      ],
    });
  });

  afterEach(() => {
    _internalApiSetBootstrapData(undefined!);
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
      ],
    });
  });
});