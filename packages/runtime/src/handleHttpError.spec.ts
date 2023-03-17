import "whatwg-fetch";
// import i18next from "i18next";
import {
  HttpFetchError,
  HttpResponseError,
  HttpParseError,
  HttpAbortError,
} from "@next-core/http";
import { httpErrorToString, handleHttpError } from "./handleHttpError.js";
import { getHistory } from "./history.js";
import { getRuntime } from "./internal/Runtime.js";

jest.mock("./history.js");
jest.mock("./internal/Runtime.js");

const spyOnModalError = (window.alert = jest.fn());
const spyOnModalConfirm = jest.spyOn(window, "confirm");
const consoleError = jest.spyOn(console, "error");

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
    expect(httpErrorToString(new HttpFetchError("oops"))).toBe(
      "网络错误，请检查您的网络连接。"
    );
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
});

describe("handleHttpError", () => {
  afterEach(() => {
    jest.clearAllMocks();
    window.NO_AUTH_GUARD = false;
  });

  it("should handle errors", () => {
    consoleError.mockImplementationOnce(() => void 0);
    const error = new Error("oops");
    handleHttpError(error);
    expect(spyOnModalError).toBeCalledTimes(1);
    expect(spyOnModalError).toBeCalledWith("Error: oops");
    expect(consoleError).toBeCalledTimes(1);
  });

  it("should handle unauthenticated errors and redirect to general login page", () => {
    consoleError.mockImplementationOnce(() => void 0);
    spyOnGetRuntime.mockReturnValueOnce({
      getFeatureFlags: () => ({ "sso-enabled": false }),
    });
    spyOnModalConfirm.mockReturnValueOnce(true);
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    handleHttpError(error);
    handleHttpError(error);
    expect(spyOnModalError).not.toBeCalled();
    expect(spyOnModalConfirm).toBeCalledTimes(1);
    expect(spyOnModalError).not.toBeCalled();
    expect(spyOnHistoryPush).toBeCalledWith("/auth/login", {
      from: {
        pathname: "/no-where",
      },
    });
  });

  it("should not show modal to go to login page when unauthenticated error occurs while NO_AUTH_GUARD is enabled", () => {
    consoleError.mockImplementationOnce(() => void 0);
    window.NO_AUTH_GUARD = true;
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    handleHttpError(error);
    expect(spyOnModalConfirm).not.toBeCalled();
    expect(spyOnModalError).toBeCalledTimes(1);
  });

  it("should return undefined if abort http request", () => {
    handleHttpError(new HttpAbortError("The user aborted a request."));
    expect(spyOnModalConfirm).not.toBeCalled();
    expect(spyOnModalError).not.toBeCalled();
    expect(spyOnModalError).not.toBeCalled();
  });
});
