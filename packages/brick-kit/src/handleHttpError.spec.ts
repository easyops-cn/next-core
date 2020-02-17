import "whatwg-fetch";
import { Modal } from "antd";
import i18next from "i18next";
import {
  HttpFetchError,
  HttpResponseError,
  HttpParseError
} from "@easyops/brick-http";
import { httpErrorToString, handleHttpError } from "./handleHttpError";
import { isUnauthenticatedError } from "./isUnauthenticatedError";
import { getHistory } from "./history";

jest.mock("./isUnauthenticatedError");
jest.mock("./history");

const spyOnModalError = jest.spyOn(Modal, "error");
jest.spyOn(i18next, "t").mockImplementation(k => k);
const spyOnIsUnauthenticatedError = isUnauthenticatedError as jest.Mock;
const spyOnHistoryPush = jest.fn();
(getHistory as jest.Mock).mockReturnValue({
  push: spyOnHistoryPush
});
(window as any).Event = class {};
(window as any).HTMLScriptElement = class {};

describe("httpErrorToString", () => {
  it("should return Errors", () => {
    expect(httpErrorToString(new Error("oops"))).toBe("Error: oops");
  });

  it("should return HttpFetchErrors", () => {
    expect(httpErrorToString(new HttpFetchError("oops"))).toBe(
      "HttpFetchError: oops"
    );
  });

  it("should return HttpResponseErrors", () => {
    expect(
      httpErrorToString(
        new HttpResponseError(
          new Response("", {
            status: 500,
            statusText: "Internal Server Error"
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
            statusText: "Internal Server Error"
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
            statusText: "Internal Server Error"
          })
        )
      )
    ).toBe("HttpResponseError: Internal Server Error");
  });

  it("should return HttpParseErrors", () => {
    expect(httpErrorToString(new HttpParseError(new Response("")))).toBe(
      "HttpParseError: OK"
    );
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
    spyOnModalError.mockClear();
  });

  it("should handle errors", () => {
    spyOnIsUnauthenticatedError.mockReturnValueOnce(false);
    handleHttpError(new Error("oops"));
    expect(spyOnModalError.mock.calls[0][0]).toEqual({
      title: "brick-kit:REQUEST_FAILED",
      content: "Error: oops",
      okText: "brick-kit:MODAL_OK"
    });
  });

  it("should handle unauthenticated errors", () => {
    spyOnIsUnauthenticatedError.mockReturnValueOnce(true);
    handleHttpError(new Error("oops"));
    expect(spyOnModalError).not.toBeCalled();
    expect(spyOnHistoryPush.mock.calls[0][0]).toBe("/auth/login");
  });
});
