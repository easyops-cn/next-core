import "whatwg-fetch";
import React from "react";
import { mount } from "enzyme";
import { Modal } from "antd";
import i18next from "i18next";
import {
  HttpFetchError,
  HttpResponseError,
  HttpParseError,
} from "@easyops/brick-http";
import {
  httpErrorToString,
  handleHttpError,
  LoginTimeoutMessage,
} from "./handleHttpError";
import { isUnauthenticatedError } from "./isUnauthenticatedError";
import { getHistory } from "./history";

jest.mock("./isUnauthenticatedError");
jest.mock("./history");

const spyOnModalError = jest.spyOn(Modal, "error");
const spyOnModalConfirm = jest.spyOn(Modal, "confirm");

jest.spyOn(i18next, "t").mockImplementation((k) => k);
const spyOnIsUnauthenticatedError = isUnauthenticatedError as jest.Mock;
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
  });

  it("should handle errors", () => {
    spyOnIsUnauthenticatedError.mockReturnValueOnce(false);
    handleHttpError(new Error("oops"));
    expect(spyOnModalError).toBeCalledWith({
      title: "brick-kit:REQUEST_FAILED",
      content: "Error: oops",
      okText: "brick-kit:MODAL_OK",
    });
  });

  it("should handle unauthenticated errors", () => {
    spyOnIsUnauthenticatedError.mockReturnValueOnce(true);
    handleHttpError(new Error("oops"));
    spyOnIsUnauthenticatedError.mockReturnValueOnce(true);
    handleHttpError(new Error("oops"));
    expect(spyOnModalError).not.toBeCalled();
    expect(spyOnModalConfirm).toBeCalledTimes(1);
    expect(spyOnModalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        okText: "brick-kit:MODAL_OK",
        cancelText: "brick-kit:MODAL_CANCEL",
      })
    );
    expect(spyOnHistoryPush).not.toBeCalled();

    spyOnModalConfirm.mock.calls[0][0].onOk();
    expect(spyOnHistoryPush).toBeCalledWith("/auth/login", {
      from: {
        pathname: "/no-where",
      },
    });
  });
});

describe("LoginTimeoutMessage", () => {
  it("should work", () => {
    const wrapper = mount(<LoginTimeoutMessage />);
    expect(wrapper.text()).toBe("brick-kit:LOGIN_TIMEOUT_MESSAGE");
    wrapper.unmount();
  });
});
