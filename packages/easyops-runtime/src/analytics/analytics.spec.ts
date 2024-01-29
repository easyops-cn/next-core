import { describe, test, jest, expect, afterEach } from "@jest/globals";
import {
  createPageView,
  earlyFinishPageView,
  finishPageView,
  initialize,
  pushApiMetric,
} from "./analytics.js";
import { Blob } from "node:buffer";
import { ensureMocksReset, requestIdleCallback } from "@shopify/jest-dom-mocks";

(global as any).Blob = Blob;

const sendBeacon = (navigator.sendBeacon =
  jest.fn<typeof navigator.sendBeacon>());
URL.createObjectURL = jest.fn<typeof URL.createObjectURL>(
  () => "http://localhost/abc-def"
);
URL.revokeObjectURL = jest.fn();

describe("analytics", () => {
  afterEach(function () {
    ensureMocksReset();
    sendBeacon.mockClear();
  });
  test("should work", async () => {
    requestIdleCallback.mock();
    initialize("http://localhost/api/stat", { maxLoggedEvents: 2 });
    // Initialize twice
    initialize("http://localhost/api/stat/2");

    // No metrics yet
    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeacon).not.toBeCalled();

    // API requests before page view
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/1",
      duration: 10,
      size: 1100,
    } as any);

    // Page view
    createPageView();

    // API requests during page view
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/2",
      duration: 15,
      size: 1200,
    } as any);

    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/3",
      duration: 15,
      size: 1200,
    } as any);

    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/4",
      duration: 15,
      size: 1200,
    } as any);

    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/5",
      duration: 15,
      size: 1200,
    } as any);

    // Page view finish
    finishPageView({
      type: "page",
      route: "/home/:objectId",
      lt: 50,
    } as any);

    // API requests after page view
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/6",
      duration: 20,
      size: 1300,
    } as any);

    // API requests after page view (no size)
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/7",
      duration: 30,
      size: -1,
    } as any);
    requestIdleCallback.runIdleCallbacks();
    expect(sendBeacon).toBeCalledTimes(1);

    const blob_1 = sendBeacon.mock.calls[0][1] as Blob;
    const api_1 = sendBeacon.mock.calls[0][0];
    expect(api_1).toEqual("http://localhost/api/stat");
    expect(JSON.parse(await blob_1.text())).toEqual({
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
          route: "/home/:objectId",
          lt: 50,
          pageId: "88-abc-def",
          apiCount: 4,
          maxApiTimeCost: 15,
          size: 4800,
        },
        {
          type: "api",
          api: "http://localhost/api/test/2",
          duration: 15,
          size: 1200,
          lt: 50,
          route: "/home/:objectId",
          pageId: "88-abc-def",
        },
      ],
    });

    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeacon).toBeCalledTimes(2);
    const api_2 = sendBeacon.mock.calls[1][0];
    expect(api_2).toBe("http://localhost/api/stat");
    expect(
      JSON.parse(await (sendBeacon.mock.calls[1][1] as Blob).text())
    ).toEqual({
      model: "easyops.FRONTEND_STAT",
      columns: expect.arrayContaining(["lt"]),
      data: [
        {
          type: "api",
          api: "http://localhost/api/test/3",
          duration: 15,
          size: 1200,
          lt: 50,
          route: "/home/:objectId",
          pageId: "88-abc-def",
        },
        {
          type: "api",
          api: "http://localhost/api/test/4",
          duration: 15,
          size: 1200,
          lt: 50,
          route: "/home/:objectId",
          pageId: "88-abc-def",
        },
      ],
    });

    // Early finish page view
    createPageView();
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/8",
      duration: 40,
      size: 1400,
    } as any);
    earlyFinishPageView();

    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeacon).toBeCalledTimes(3);
    expect(
      JSON.parse(await (sendBeacon.mock.calls[2][1] as Blob).text())
    ).toEqual({
      model: "easyops.FRONTEND_STAT",
      columns: expect.arrayContaining(["lt"]),
      data: [
        {
          type: "api",
          api: "http://localhost/api/test/5",
          duration: 15,
          size: 1200,
          lt: 50,
          route: "/home/:objectId",
          pageId: "88-abc-def",
        },
        {
          type: "apiRequest",
          api: "http://localhost/api/test/6",
          duration: 20,
          size: 1300,
          lt: 50,
          route: "/home/:objectId",
          pageId: "88-abc-def",
        },
      ],
    });

    createPageView();
    // Page view finish again
    finishPageView({
      type: "page",
      route: "/home/another",
      lt: 60,
    } as any);

    expect(sendBeacon).toBeCalledTimes(4);
    expect(
      JSON.parse(await (sendBeacon.mock.calls[3][1] as Blob).text())
    ).toEqual({
      model: "easyops.FRONTEND_STAT",
      columns: expect.arrayContaining(["lt"]),
      data: [
        {
          type: "apiRequest",
          api: "http://localhost/api/test/7",
          duration: 30,
          size: -1,
          lt: 50,
          route: "/home/:objectId",
          pageId: "88-abc-def",
        },
        {
          type: "api",
          api: "http://localhost/api/test/8",
          duration: 40,
          size: 1400,
        },
      ],
    });

    requestIdleCallback.cancelIdleCallbacks();
    requestIdleCallback.restore();
    sendBeacon.mockClear();
  });
});
