import { apiAnalyzer } from ".";
import {
  HttpParseError,
  HttpResponse,
  HttpResponseError,
} from "@next-core/brick-http";
import "whatwg-fetch";

jest.spyOn(window, "addEventListener");
const mockSendBeacon = jest.fn();
(global as any).navigator.sendBeacon = mockSendBeacon;

describe("ApiAnalysis", () => {
  const uuid = "13be32d5-9868-417b-9ee5-528910ede818";
  const route = "/developers/:id";
  (global as any).URL = {
    createObjectURL: () => `blob:https://google.com/${uuid}`,
    revokeObjectURL: jest.fn(),
  };
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
    pageTracker(route);
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
        "route",
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
        apiCount: 1,
        lt: 0,
        page: "http://localhost/",
        pageId: "88-13be32d5-9868-417b-9ee5-528910ede818",
        route: "/developers/:id",
        type: "page",
      },
      {
        api: "api/auth/login",
        code: 0,
        duration: 2,
        et: 1603109440807,
        lt: 0,
        msg: "",
        page: "http://localhost/",
        pageId: "88-" + uuid,
        size: 28,
        st: 1603109440805,
        _ver: 1603109440805,
        status: 200,
        time: 1603109440807,
        traceId: "fake-trace-id",
        type: "api",
        uid: "abc",
        username: "mock-user",
        route,
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
        "route",
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
        apiCount: 1,
        lt: 0,
        page: "http://localhost/",
        pageId: "88-13be32d5-9868-417b-9ee5-528910ede818",
        route: "/developers/:id",
        type: "page",
      },
      {
        api: "api/auth/login",
        code: 0,
        duration: 2,
        et: 1603109440807,
        lt: 0,
        msg: "",
        page: "http://localhost/",
        pageId: "88-" + uuid,
        size: 28,
        st: 1603109440805,
        _ver: 1603109440805,
        status: 200,
        time: 1603109440807,
        traceId: "fake-trace-id",
        type: "api",
        uid: "abc",
        username: "mock-user",
        route,
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
        "route",
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
        apiCount: 1,
        lt: 0,
        page: "http://localhost/",
        pageId: "88-13be32d5-9868-417b-9ee5-528910ede818",
        route: "/developers/:id",
        type: "page",
      },
      {
        api: "api/auth/login",
        code: 0,
        duration: 2,
        et: 1603109440807,
        lt: 0,
        msg: "",
        page: "http://localhost/",
        pageId: "88-" + uuid,
        size: 28,
        st: 1603109440805,
        _ver: 1603109440805,
        status: 200,
        time: 1603109440807,
        traceId: "fake-trace-id",
        type: "api",
        uid: "abc",
        username: "mock-user",
        route,
      },
    ]);
  });
});
