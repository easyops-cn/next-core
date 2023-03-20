import { jest, describe, test, expect } from "@jest/globals";
import type { UseSingleBrickConf } from "@next-core/types";
import {
  mountUseBrick,
  renderPreviewBricks,
  renderUseBrick,
  unmountUseBrick,
} from "./secret_internals.js";
import { mediaEventTarget } from "./mediaQuery.js";

jest.mock("@next-core/loader");
jest.mock("../themeAndMode.js");
const consoleInfo = jest.spyOn(console, "info");
window.scrollTo = jest.fn();

const IntersectionObserver = jest.fn((callback: Function) => {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
  };
});
(window as any).IntersectionObserver = IntersectionObserver;

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

    expect(root.outerHTML).toBe(
      '<div title="container:a"><span>child:a</span></div>'
    );
    expect(document.querySelector("#portal-mount-point")?.innerHTML).toBe(
      "<div><p>portal:a</p></div>"
    );

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

  test("if: alse", async () => {
    const useBrick: UseSingleBrickConf = {
      brick: "div",
      if: false,
    };
    const renderResult = await renderUseBrick(useBrick, "a");
    expect(renderResult.tagName).toBe(null);
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

describe("preview", () => {
  test("general", async () => {
    const main = document.createElement("div");
    const portal = document.createElement("div");

    await renderPreviewBricks(
      [
        {
          brick: "div",
          properties: {
            textContent: "Hello Preview",
          },
        },
        {
          brick: "p",
          properties: {
            textContent: "I'm portal",
          },
          portal: true,
        },
      ],
      { main, portal }
    );

    expect(main.innerHTML).toBe("<div>Hello Preview</div>");
    expect(portal.innerHTML).toBe("<p>I'm portal</p>");

    await renderPreviewBricks(
      [
        {
          brick: "div",
          properties: {
            textContent: "Goodbye Preview",
          },
        },
        {
          brick: "p",
          properties: {
            textContent: "I'm also portal",
          },
          portal: true,
        },
      ],
      { main, portal }
    );

    expect(main.innerHTML).toBe("<div>Goodbye Preview</div>");
    expect(portal.innerHTML).toBe("<p>I'm also portal</p>");
  });
});
