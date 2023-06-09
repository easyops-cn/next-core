import "whatwg-fetch";
import {
  HttpFetchError,
  HttpResponseError,
  HttpParseError,
  HttpAbortError,
} from "@next-core/http";
import { initializeI18n } from "@next-core/i18n";
import { httpErrorToString, handleHttpError } from "./handleHttpError.js";
import { getHistory } from "./history.js";
import { getRuntime } from "./internal/Runtime.js";
import { Dialog } from "./Dialog.js";

initializeI18n();

jest.mock("./history.js");
jest.mock("./internal/Runtime.js");
jest.mock("./Dialog.js");

const consoleError = jest.spyOn(console, "error");
const showDialog = Dialog.show as jest.MockedFunction<typeof Dialog.show>;

const spyOnGetRuntime = getRuntime as jest.Mock;
const spyOnHistoryPush = jest.fn();
(getHistory as jest.Mock).mockReturnValue({
  push: spyOnHistoryPush,
  location: {
    pathname: "/no-where",
    state: {
      notify: false,
    },
  },
});

(window as any).Event = class {};
(window as any).HTMLScriptElement = class {};

describe("httpErrorToString", () => {
  it("should return Errors", () => {
    expect(httpErrorToString(new Error("oops"))).toBe("Error: oops");
  });

  it("should return network error for HttpFetchErrors", () => {
    expect(httpErrorToString(new HttpFetchError("oops"))).toBe("NETWORK_ERROR");
  });

  it("should return HttpResponseErrors", () => {
    expect(
      httpErrorToString(
        new HttpResponseError(
          new Response("", {
            status: 500,
            statusText: "Internal Server Error",
          }),
          { error: "oops" }
        )
      )
    ).toBe("oops");
  });

  it("should return HttpResponseErrors with msg compatible", () => {
    expect(
      httpErrorToString(
        new HttpResponseError(
          new Response("", {
            status: 500,
            statusText: "Internal Server Error",
          }),
          { msg: "oops" }
        )
      )
    ).toBe("oops");
  });

  it("should return HttpResponseErrors without json", () => {
    expect(
      httpErrorToString(
        new HttpResponseError(
          new Response("", {
            status: 500,
            statusText: "Internal Server Error",
          })
        )
      )
    ).toBe("HttpResponseError: Internal Server Error");
  });

  it("should return HttpParseErrors", () => {
    expect(
      httpErrorToString(
        new HttpParseError(
          new Response("", {
            status: 200,
            statusText: "OK",
          })
        )
      )
    ).toBe("HttpParseError: OK");
  });

  it("should return script src if load script failed", () => {
    const script = new HTMLScriptElement();
    script.src = "not-existed-script-src";
    const event = new Event("error");
    (event as any).target = script;
    expect(httpErrorToString(event)).toBe("not-existed-script-src");
  });

  it("should handle unknown error", () => {
    expect(httpErrorToString(null)).toBe("Unknown error");
  });
});

describe("handleHttpError", () => {
  afterEach(() => {
    window.NO_AUTH_GUARD = false;
  });

  it("should handle errors", async () => {
    consoleError.mockReturnValue();
    showDialog.mockResolvedValueOnce();
    const error = new Error("oops");
    handleHttpError(error);
    // Mock triggering the same error twice.
    handleHttpError(error);
    expect(Dialog.show).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(Dialog.show).toBeCalledWith(
      expect.objectContaining({
        type: "error",
        content: "Error: oops",
      })
    );
    expect(consoleError).toBeCalledTimes(2);
    consoleError.mockReset();
  });

  it("should handle unauthenticated errors and redirect to general login page", async () => {
    spyOnGetRuntime.mockReturnValueOnce({
      getFeatureFlags: () => ({}),
    });
    showDialog.mockResolvedValueOnce();
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    handleHttpError(error);
    // Mock triggering the same error twice.
    handleHttpError(error);
    expect(Dialog.show).toBeCalledTimes(1);
    expect(Dialog.show).toBeCalledWith(
      expect.objectContaining({
        type: "confirm",
      })
    );
    await (global as any).flushPromises();
    expect(spyOnHistoryPush).toBeCalledWith("/auth/login", {
      from: {
        pathname: "/no-where",
      },
    });
    expect(consoleError).not.toBeCalled();
  });

  it("should handle unauthenticated errors and redirect to sso login page", async () => {
    spyOnGetRuntime.mockReturnValueOnce({
      getFeatureFlags: () => ({ "sso-enabled": true }),
    });
    showDialog.mockResolvedValueOnce();
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    handleHttpError(error);
    expect(Dialog.show).toBeCalledTimes(1);
    expect(Dialog.show).toBeCalledWith(
      expect.objectContaining({
        type: "confirm",
      })
    );
    await (global as any).flushPromises();
    expect(spyOnHistoryPush).toBeCalledWith("/sso-auth/login", {
      from: {
        pathname: "/no-where",
      },
    });
    expect(consoleError).not.toBeCalled();
  });

  it("should handle unauthenticated errors and redirect to general login page", async () => {
    spyOnGetRuntime.mockReturnValueOnce({
      getFeatureFlags: () => ({}),
    });
    showDialog.mockRejectedValueOnce(undefined);
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    handleHttpError(error);
    expect(Dialog.show).toBeCalledTimes(1);
    expect(Dialog.show).toBeCalledWith(
      expect.objectContaining({
        type: "confirm",
      })
    );
    await (global as any).flushPromises();
    expect(spyOnHistoryPush).not.toBeCalled();
    expect(consoleError).not.toBeCalled();
  });

  it("should not show modal to go to login page when unauthenticated error occurs while NO_AUTH_GUARD is enabled", () => {
    consoleError.mockReturnValueOnce();
    window.NO_AUTH_GUARD = true;
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    showDialog.mockResolvedValueOnce();
    handleHttpError(error);
    expect(Dialog.show).toBeCalledWith(
      expect.objectContaining({
        type: "error",
        content: "HttpResponseError",
      })
    );
    expect(consoleError).toBeCalledTimes(1);
  });

  it("should return undefined if abort http request", () => {
    handleHttpError(new HttpAbortError("The user aborted a request."));
    expect(Dialog.show).not.toBeCalled();
  });
});
