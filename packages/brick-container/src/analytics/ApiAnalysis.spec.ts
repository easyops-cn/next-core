import { apiAnalyzer } from ".";
import {
  HttpParseError,
  HttpResponse,
  HttpResponseError,
} from "@easyops/brick-http";
import "whatwg-fetch";

import * as kit from "@easyops/brick-kit";

jest.spyOn(kit, "getRuntime").mockReturnValue({
  getFeatureFlags: jest.fn().mockReturnValue({ "enable-analyzer": true }),
  getBasePath: jest.fn().mockReturnValue("/"),
} as any);

jest.spyOn(window, "addEventListener");
const mockSendBeacon = jest.fn();
(global as any).navigator.sendBeacon = mockSendBeacon;
describe("ApiAnalysis", () => {
  let analyzer: ReturnType<typeof apiAnalyzer.create>;
  beforeEach(() => {
    kit.authenticate({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
    });
    analyzer = apiAnalyzer.create();
    Date.now = jest.fn(() => 1603109440807);
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    mockSendBeacon.mockClear();
    process.env.NODE_ENV = "test";
  });

  it("should analysis api response", async () => {
    const response = {
      config: {
        url: "api/auth/login",
        method: "GET",
        meta: {
          st: 1603109440805,
          type: "api",
          page: "http://localhost:8081/developers/brick-book?category=",
        },
      },
      status: 200,
      statusText: "OK",
      headers: new Headers({ "x-b3-traceid": "fake-trace-id" }),
      data: {
        code: 0,
        error: "",
        message: "",
        data: {
          loggedIn: true,
          username: "easyops",
          org: 8888,
          location: "",
          userInstanceId: "5c6bbc5010976",
          loginFrom: "easyops",
        },
      },
    };
    analyzer.analyses(response as any);
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "st",
        "et",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "api",
        "type",
        "msg",
        "status",
      ],
      data: [response],
    };
    const headers = {
      type: "application/json",
    };
    const blob = new Blob([JSON.stringify(data)], headers);
    window.dispatchEvent(new Event("beforeunload"));
    //const d = await blob.text()
    expect(mockSendBeacon).toHaveBeenCalledWith(analyzer.api, blob);
    expect(analyzer.logs).toEqual([
      {
        api: "api/auth/login",
        code: 0,
        duration: 2,
        et: 1603109440807,
        msg: "",
        page: "http://localhost/",
        st: 1603109440805,
        status: 200,
        traceId: "fake-trace-id",
        type: "api",
        uid: "abc",
      },
    ]);
  });

  it("should analysis HttpResponseError", async () => {
    const err = new HttpResponseError(
      new Response('{"error":"oops"}', {
        status: 500,
      })
    );
    const response = {
      config: {
        url: "api/auth/login",
        method: "GET",
        meta: {
          st: 1603109440805,
          type: "api",
          page: "http://localhost:8081/developers/brick-book?category=",
        },
      },
      error: err,
    };
    analyzer.analyses(response as any);
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "st",
        "et",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "api",
        "type",
        "msg",
        "status",
      ],
      data: [response],
    };
    const headers = {
      type: "application/json",
    };
    const blob = new Blob([JSON.stringify(data)], headers);
    window.dispatchEvent(new Event("beforeunload"));
    expect(mockSendBeacon).toHaveBeenCalledWith(analyzer.api, blob);
    expect(analyzer.logs).toEqual([
      {
        st: 1603109440805,
        type: "api",
        page: "http://localhost/",
        et: 1603109440807,
        duration: 2,
        api: "api/auth/login",
        uid: "abc",
        code: "",
        msg: "",
        status: 500,
        traceId: null,
      },
    ]);
  });

  it("should analysis HttpParseError", async () => {
    const err = new HttpParseError(new Response("non-json", { status: 200 }));
    const response = {
      config: {
        url: "api/auth/login",
        method: "GET",
        meta: {
          st: 1603109440805,
          type: "api",
          page: "http://localhost:8081/developers/brick-book?category=",
        },
      },
      error: err,
    };
    analyzer.analyses(response as any);
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "st",
        "et",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "api",
        "type",
        "msg",
        "status",
      ],
      data: [response],
    };
    const headers = {
      type: "application/json",
    };
    const blob = new Blob([JSON.stringify(data)], headers);
    window.dispatchEvent(new Event("beforeunload"));
    expect(mockSendBeacon).toHaveBeenCalledWith(analyzer.api, blob);
    expect(analyzer.logs).toEqual([
      {
        st: 1603109440805,
        type: "api",
        code: "",
        msg: "",
        page: "http://localhost/",
        et: 1603109440807,
        duration: 2,
        api: "api/auth/login",
        uid: "abc",
        status: 200,
        traceId: null,
      },
    ]);
  });
});
