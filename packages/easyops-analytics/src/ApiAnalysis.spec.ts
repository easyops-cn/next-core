import { apiAnalyzer } from ".";
import {
  ensureMocksReset,
  requestIdleCallback,
  animationFrame,
} from "@shopify/jest-dom-mocks";
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
  const params = {
    path: "/developers/:id",
    pageTitle: "test",
    username: "mock-user",
  } as any;

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
    pageTracker = analyzer.tracePage();
  });

  afterEach(() => {
    ensureMocksReset();
    mockSendBeacon.mockClear();
    pageTracker = null;
    process.env.NODE_ENV = "test";
  });

  it("should analysis api response", async () => {
    requestIdleCallback.mock();

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

    const response2 = {
      config: {
        url: "api/auth/login2",
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
        "x-b3-traceid": "fake-trace-id2",
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
    analyzer.analyses((response as any).data);
    pageTracker(params);
    analyzer.analyses(response2);
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
        "pageId",
        "route",
        "apiCount",
        "maxApiTimeCost",
        "apiSizeCost",
        "pageTitle",
      ],
      data: [
        {
          type: "page",
          apiCount: 0,
          page: "http://localhost/",
          time: 1603109441,
          _ver: 1603109440807,
          maxApiTimeCost: 0,
          st: 1603109440807,
          et: 1603109440807,
          size: 0,
          pageTitle: "test",
          username: "mock-user",
          lt: 0,
          route: "/developers/:id",
          pageId: "88-13be32d5-9868-417b-9ee5-528910ede818",
        },
        {
          st: 1603109440805,
          _ver: 1603109440805,
          uid: "abc",
          time: 1603109440807,
          username: "mock-user",
          et: 1603109440807,
          page: "http://localhost/",
          duration: 2,
          api: "api/auth/login2",
          type: "apiRequest",
          code: 0,
          msg: "",
          status: 200,
          traceId: "fake-trace-id2",
          size: 28,
          lt: 0,
          route: "/developers/:id",
          pageId: "88-13be32d5-9868-417b-9ee5-528910ede818",
        },
      ],
    };
    const headers = {
      type: "application/json",
    };
    const blob = new Blob([JSON.stringify(data)], headers);
    requestIdleCallback.runIdleCallbacks();
    await jest.runAllTimers();
    expect(mockSendBeacon.mock.calls[0][0]).toEqual("fakeapi.com");
    expect(mockSendBeacon.mock.calls[0][1].size).toEqual(blob.size);
    window.dispatchEvent(new Event("beforeunload"));
    //const d = await blob.text()
    expect(apiAnalyzer.getInstance()).toBeTruthy();
    expect(mockSendBeacon.mock.calls.length).toEqual(1);
    expect(analyzer.logs.length).toEqual(0);
    requestIdleCallback.restore();
  });

  it("should analysis HttpResponseError", async () => {
    //requestIdleCallback.mock();
    requestIdleCallback.mockAsUnsupported();
    animationFrame.mock();
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
    analyzer.analyses((response as any).data);
    pageTracker(params);
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
        "pageId",
        "route",
        "apiCount",
        "maxApiTimeCost",
        "apiSizeCost",
        "pageTitle",
      ],
      data: [
        {
          type: "page",
          apiCount: 0,
          page: "http://localhost/",
          time: 1603109441,
          _ver: 1603109440807,
          maxApiTimeCost: 0,
          st: 1603109440807,
          et: 1603109440807,
          size: 0,
          pageTitle: "test",
          username: "mock-user",
          lt: 0,
          route: "/developers/:id",
          pageId: "13be32d5-9868-417b-9ee5-528910ede818",
        },
      ],
    };
    const headers = {
      type: "application/json",
    };
    const blob = new Blob([JSON.stringify(data)], headers);
    //requestIdleCallback.runIdleCallbacks();
    // animationFrame.runFrame();
    await jest.runAllTimers();
    expect(mockSendBeacon.mock.calls[0][0]).toEqual("fakeapi.com");
    expect(mockSendBeacon.mock.calls[0][1].size).toEqual(blob.size);
    window.dispatchEvent(new Event("beforeunload"));
    //const d = await blob.text()
    expect(apiAnalyzer.getInstance()).toBeTruthy();
    expect(mockSendBeacon.mock.calls.length).toEqual(1);
    expect(analyzer.logs.length).toEqual(0);
    animationFrame.restore();
    requestIdleCallback.restore();
  });
  it("should analysis HttpParseError", async () => {
    requestIdleCallback.mock();
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
    pageTracker(params);
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
        "pageId",
        "route",
        "apiCount",
        "maxApiTimeCost",
        "apiSizeCost",
        "pageTitle",
      ],
      data: [
        {
          type: "page",
          apiCount: 1,
          page: "http://localhost/",
          time: 1603109441,
          _ver: 1603109440807,
          maxApiTimeCost: 2,
          st: 1603109440807,
          et: 1603109440807,
          size: -1,
          pageTitle: "test",
          username: "mock-user",
          lt: 0,
          route: "/developers/:id",
          pageId: "13be32d5-9868-417b-9ee5-528910ede818",
        },
        {
          st: 1603109440805,
          _ver: 1603109440805,
          username: "mock-user",
          time: 1603109440807,
          type: "api",
          et: 1603109440807,
          page: "http://localhost/",
          duration: 2,
          api: "api/auth/login",
          code: -1,
          msg: "",
          status: 200,
          traceId: null,
          size: -1,
          lt: 0,
          route: "/developers/:id",
          pageId: "13be32d5-9868-417b-9ee5-528910ede818",
        },
      ],
    } as any;
    const headers = {
      type: "application/json",
    };
    const blob = new Blob([JSON.stringify(data)], headers);
    requestIdleCallback.runIdleCallbacks();
    await jest.runAllTimers();
    expect(mockSendBeacon.mock.calls[0][0]).toEqual("fakeapi.com");
    expect(mockSendBeacon.mock.calls[0][1].size).toEqual(blob.size);
    window.dispatchEvent(new Event("beforeunload"));

    expect(apiAnalyzer.getInstance()).toBeTruthy();
    expect(mockSendBeacon.mock.calls.length).toEqual(1);
    expect(analyzer.logs.length).toEqual(0);
    requestIdleCallback.restore();
  });
});
