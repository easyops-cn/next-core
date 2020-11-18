import { apiAnalyzer } from ".";
import {
  HttpParseError,
  HttpResponse,
  HttpResponseError,
} from "@easyops/brick-http";
import "whatwg-fetch";

jest.spyOn(window, "addEventListener");
const mockSendBeacon = jest.fn();
(global as any).navigator.sendBeacon = mockSendBeacon;

describe("ApiAnalysis", () => {
  let analyzer: ReturnType<typeof apiAnalyzer.create>;
  let pageTracker: any;
  beforeEach(() => {
    analyzer = apiAnalyzer.create({
      api: "fakeapi.com",
    });
    Date.now = jest.fn(() => 1603109440807);
    Math.random = jest.fn(() => 0.2);
    process.env.NODE_ENV = "production";
    pageTracker = analyzer.pageTracker();
  });

  afterEach(() => {
    mockSendBeacon.mockClear();
    pageTracker = null;
    process.env.NODE_ENV = "test";
  });

  it("should analysis api response", async () => {
    const response = {
      config: {
        url: "api/auth/login",
        method: "GET",
        meta: {
          st: 1603109440805,
          time: 1603109440807,
          type: "api",
          page: "http://localhost:8081/developers/brick-book?category=",
          org: 8888,
          username: "mock-user",
          uid: "abc",
        },
      },
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "x-b3-traceid": "fake-trace-id",
        "content-length": "28",
      }),
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
    pageTracker();
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "_ver",
        "st",
        "et",
        "lt",
        "size",
        "time",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "username",
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
    expect(apiAnalyzer.getInstance()).toBeTruthy();
    expect(mockSendBeacon).toHaveBeenCalledWith(analyzer.api, blob);
    expect(analyzer.logs).toEqual([
      {
        api: "api/auth/login",
        code: 0,
        duration: 2,
        et: 1603109440807,
        lt: 0,
        msg: "",
        page: "http://localhost/",
        pageId: "page-0-0-200",
        size: 28,
        st: 1603109440805,
        _ver: 1603109440805,
        status: 200,
        time: 1603109440807,
        traceId: "fake-trace-id",
        type: "api",
        uid: "abc",
        username: "mock-user",
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
          time: 1603109440807,
          type: "api",
          page: "http://localhost:8081/developers/brick-book?category=",
          org: 8888,
          username: "mock-user",
          userInstanceId: "abc",
        },
      },
      error: err,
    };
    analyzer.analyses(response as any);
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "_ver",
        "st",
        "et",
        "lt",
        "size",
        "time",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "username",
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
        api: "api/auth/login",
        code: 0,
        duration: 2,
        et: 1603109440807,
        lt: 0,
        msg: "",
        page: "http://localhost/",
        pageId: "page-0-0-200",
        size: 28,
        st: 1603109440805,
        _ver: 1603109440805,
        status: 200,
        time: 1603109440807,
        traceId: "fake-trace-id",
        type: "api",
        uid: "abc",
        username: "mock-user",
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
          time: 1603109440807,
          type: "api",
          page: "http://localhost:8081/developers/brick-book?category=",
          org: 8888,
          username: "mock-user",
          userInstanceId: "abc",
        },
      },
      error: err,
    };
    analyzer.analyses(response as any);
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "_ver",
        "st",
        "et",
        "lt",
        "size",
        "time",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "username",
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
        api: "api/auth/login",
        code: 0,
        duration: 2,
        et: 1603109440807,
        lt: 0,
        msg: "",
        page: "http://localhost/",
        pageId: "page-0-0-200",
        size: 28,
        st: 1603109440805,
        _ver: 1603109440805,
        status: 200,
        time: 1603109440807,
        traceId: "fake-trace-id",
        type: "api",
        uid: "abc",
        username: "mock-user",
      },
    ]);
  });
});
