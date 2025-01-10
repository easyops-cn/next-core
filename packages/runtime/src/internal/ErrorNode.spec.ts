import { jest, describe, test, expect } from "@jest/globals";
import { BrickLoadError, loadBricksImperatively } from "@next-core/loader";
import { initializeI18n } from "@next-core/i18n";
import { ErrorNode, PageError } from "./ErrorNode.js";
import { RenderTag } from "./enums.js";
import type { RenderReturnNode } from "./interfaces.js";
import { HttpResponseError } from "@next-core/http";
import { _internalApiGetPresetBricks } from "./Runtime.js";

initializeI18n();

jest.mock("@next-core/loader", () => ({
  BrickLoadError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "BrickLoadError";
    }
  },
  loadBricksImperatively: jest.fn<() => Promise<void>>().mockResolvedValue(),
}));

jest.mock("./Runtime.js", () => ({
  _internalApiGetPresetBricks: jest.fn().mockImplementation(() => ({})),
  getBrickPackages() {
    return [];
  },
}));

const mockedLoadBricks = loadBricksImperatively as jest.MockedFunction<
  () => Promise<void>
>;
const mockedGetPresetBricks =
  _internalApiGetPresetBricks as jest.MockedFunction<
    typeof _internalApiGetPresetBricks
  >;

describe("ErrorNode", () => {
  test("default error", async () => {
    expect(
      await ErrorNode(new Error("oops"), {
        tag: RenderTag.ROOT,
      } as RenderReturnNode)
    ).toEqual({
      properties: {
        errorTitle: "UNKNOWN_ERROR",
        dataset: {
          errorBoundary: "",
        },
        style: {
          color: "var(--color-error)",
        },
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "div",
      child: expect.objectContaining({
        type: "div",
        properties: {
          textContent: "UNKNOWN_ERROR: Error: oops",
        },
      }),
    });
  });

  test("no permission", async () => {
    expect(
      await ErrorNode(
        new HttpResponseError({
          status: 403,
          statusText: "Forbidden",
        } as Response),
        {
          tag: RenderTag.ROOT,
        } as RenderReturnNode
      )
    ).toEqual({
      properties: {
        errorTitle: "NO_PERMISSION",
        dataset: {
          errorBoundary: "",
        },
        style: {
          color: "var(--color-error)",
        },
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "div",
      child: expect.objectContaining({
        type: "div",
        properties: {
          textContent: "NO_PERMISSION: HttpResponseError: Forbidden",
        },
      }),
    });
  });

  test("network error", async () => {
    expect(
      await ErrorNode(new BrickLoadError("oops"), {
        tag: RenderTag.ROOT,
      } as RenderReturnNode)
    ).toEqual({
      properties: {
        errorTitle: "NETWORK_ERROR",
        dataset: {
          errorBoundary: "",
        },
        style: {
          color: "var(--color-error)",
        },
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "div",
      child: expect.objectContaining({
        type: "div",
        properties: {
          textContent: "NETWORK_ERROR: BrickLoadError: oops",
        },
      }),
    });
  });

  test("page level without go back link", async () => {
    expect(
      await ErrorNode(
        new Error("oops"),
        {
          tag: RenderTag.ROOT,
        } as RenderReturnNode,
        true
      )
    ).toEqual({
      properties: {
        dataset: {
          errorBoundary: "",
        },
        variant: "unknown-error",
        errorTitle: "UNKNOWN_ERROR",
        description: "Error: oops",
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "illustrations.error-message",
      child: expect.objectContaining({
        type: "eo-link",
        properties: {
          textContent: "GO_BACK_TO_PREVIOUS_PAGE",
        },
        events: {
          click: {
            action: "history.goBack",
          },
        },
      }),
    });
  });

  test("page level with go back link", async () => {
    expect(
      await ErrorNode(
        new HttpResponseError(
          {
            status: 400,
            statusText: "Bad Request",
          } as Response,
          {
            code: "200000",
          }
        ),
        {
          tag: RenderTag.ROOT,
        } as RenderReturnNode,
        true
      )
    ).toEqual({
      properties: {
        dataset: {
          errorBoundary: "",
        },
        variant: "license-expired",
        errorTitle: "LICENSE_EXPIRED",
        description: "HttpResponseError: Bad Request",
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "illustrations.error-message",
    });
  });

  test("page level and load bricks timeout", async () => {
    mockedLoadBricks.mockImplementationOnce(() => {
      return new Promise((resolve) => setTimeout(resolve, 4e3));
    });
    const consoleError = jest.spyOn(console, "error").mockReturnValue();

    jest.useFakeTimers();

    const promise = ErrorNode(
      new HttpResponseError(
        {
          status: 400,
          statusText: "Bad Request",
        } as Response,
        {
          code: "200000",
        }
      ),
      {
        tag: RenderTag.ROOT,
      } as RenderReturnNode,
      true
    );

    jest.advanceTimersByTime(3e3);

    expect(await promise).toEqual({
      properties: {
        errorTitle: "LICENSE_EXPIRED",
        dataset: {
          errorBoundary: "",
        },
        style: {
          color: "var(--color-error)",
        },
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "div",
      child: expect.objectContaining({
        type: "div",
        properties: {
          textContent: "LICENSE_EXPIRED: HttpResponseError: Bad Request",
        },
      }),
    });

    expect(consoleError).toBeCalledTimes(1);

    consoleError.mockRestore();
  });

  test("page not found", async () => {
    expect(
      await ErrorNode(
        new PageError("page not found"),
        {
          tag: RenderTag.ROOT,
        } as RenderReturnNode,
        true
      )
    ).toEqual({
      properties: {
        dataset: {
          errorBoundary: "",
        },
        variant: "not-found",
        errorTitle: "PAGE_NOT_FOUND",
        description: undefined,
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "illustrations.error-message",
      child: expect.objectContaining({
        type: "eo-link",
        properties: {
          textContent: "GO_BACK_HOME",
          href: "/",
        },
        events: undefined,
      }),
    });
  });

  test("app not found", async () => {
    expect(
      await ErrorNode(
        new PageError("app not found"),
        {
          tag: RenderTag.ROOT,
        } as RenderReturnNode,
        true
      )
    ).toEqual({
      properties: {
        dataset: {
          errorBoundary: "",
        },
        variant: "no-permission",
        errorTitle: "APP_NOT_FOUND",
        description: undefined,
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "illustrations.error-message",
      child: expect.objectContaining({
        type: "eo-link",
        properties: {
          textContent: "GO_BACK_HOME",
          href: "/",
        },
        events: undefined,
      }),
    });
  });

  test("app not found but preset error brick is false", async () => {
    mockedGetPresetBricks.mockReturnValueOnce({
      error: false,
    });

    expect(
      await ErrorNode(
        new PageError("app not found"),
        {
          tag: RenderTag.ROOT,
        } as RenderReturnNode,
        true
      )
    ).toEqual({
      properties: {
        errorTitle: "APP_NOT_FOUND",
        dataset: {
          errorBoundary: "",
        },
        style: {
          color: "var(--color-error)",
        },
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "div",
      child: expect.objectContaining({
        type: "div",
        properties: {
          textContent: "APP_NOT_FOUND",
        },
      }),
    });
  });
});

describe("with default error brick", () => {
  beforeAll(() => {
    customElements.define(
      "easyops-default-error",
      class extends HTMLElement {}
    );
  });

  test("page level with script error and default error brick", async () => {
    const consoleError = jest.spyOn(console, "error").mockReturnValue();
    const script = document.createElement("script");
    script.src = "fail.js";
    const scriptError = new Event("error");
    Object.defineProperty(scriptError, "target", { value: script });
    mockedLoadBricks.mockRejectedValueOnce(new Error("oops"));

    expect(
      await ErrorNode(
        scriptError,
        {
          tag: RenderTag.ROOT,
        } as RenderReturnNode,
        true
      )
    ).toEqual({
      properties: {
        errorTitle: "NETWORK_ERROR",
        dataset: {
          errorBoundary: "",
        },
        style: {
          color: "var(--color-error)",
        },
      },
      return: {
        tag: 1,
      },
      runtimeContext: null,
      tag: 2,
      type: "easyops-default-error",
      child: expect.objectContaining({
        type: "div",
        properties: {
          textContent: "http://localhost/fail.js",
        },
        sibling: expect.objectContaining({
          type: "a",
          slotId: "link",
          properties: {
            textContent: "RELOAD",
            href: "http://localhost/",
          },
        }),
      }),
    });
    consoleError.mockRestore();
  });
});
