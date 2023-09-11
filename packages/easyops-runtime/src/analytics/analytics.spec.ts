import { describe, test, jest, expect } from "@jest/globals";
import {
  createPageView,
  earlyFinishPageView,
  finishPageView,
  initialize,
  pushApiMetric,
} from "./analytics.js";
import { Blob } from "node:buffer";

(global as any).Blob = Blob;

const sendBeacon = (navigator.sendBeacon =
  jest.fn<typeof navigator.sendBeacon>());
URL.createObjectURL = jest.fn<typeof URL.createObjectURL>(
  () => "http://localhost/abc-def"
);
URL.revokeObjectURL = jest.fn();

describe("analytics", () => {
  test("should work", async () => {
    initialize("http://localhost/api/stat");
    // Initialize twice
    initialize("http://localhost/api/stat/2");

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

    // Page view finish
    finishPageView({
      type: "page",
      route: "/home/:objectId",
      lt: 50,
    } as any);

    // API requests after page view
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/3",
      duration: 20,
      size: 1300,
    } as any);

    // API requests after page view (no size)
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/3",
      duration: 30,
      size: -1,
    } as any);

    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeacon).toBeCalledTimes(1);
    const api = sendBeacon.mock.calls[0][0];
    const blob = sendBeacon.mock.calls[0][1] as Blob;
    expect(api).toBe("http://localhost/api/stat");
    expect(JSON.parse(await blob.text())).toEqual({
      model: "easyops.FRONTEND_STAT",
      columns: expect.arrayContaining(["lt"]),
      data: [
        {
          apiCount: 1,
          lt: 50,
          maxApiTimeCost: 15,
          pageId: "88-abc-def",
          route: "/home/:objectId",
          size: 1200,
          type: "page",
        },
        {
          api: "http://localhost/api/test/2",
          duration: 15,
          lt: 50,
          pageId: "88-abc-def",
          route: "/home/:objectId",
          size: 1200,
          type: "api",
        },
        {
          api: "http://localhost/api/test/3",
          duration: 20,
          lt: 50,
          pageId: "88-abc-def",
          route: "/home/:objectId",
          size: 1300,
          type: "apiRequest",
        },
        {
          api: "http://localhost/api/test/3",
          duration: 30,
          lt: 50,
          pageId: "88-abc-def",
          route: "/home/:objectId",
          size: -1,
          type: "apiRequest",
        },
      ],
    });

    // Early finish page view
    createPageView();
    pushApiMetric({
      type: "api",
      api: "http://localhost/api/test/4",
      duration: 40,
      size: 1400,
    } as any);
    earlyFinishPageView();

    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeacon).toBeCalledTimes(2);
    const blob2 = sendBeacon.mock.calls[1][1] as Blob;
    expect(JSON.parse(await blob2.text())).toEqual({
      model: "easyops.FRONTEND_STAT",
      columns: expect.arrayContaining(["lt"]),
      data: [
        {
          api: "http://localhost/api/test/4",
          duration: 40,
          size: 1400,
          type: "api",
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

    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeacon).toBeCalledTimes(3);
    const blob3 = sendBeacon.mock.calls[2][1] as Blob;
    expect(JSON.parse(await blob3.text())).toEqual({
      model: "easyops.FRONTEND_STAT",
      columns: expect.arrayContaining(["lt"]),
      data: [
        {
          apiCount: 0,
          lt: 60,
          maxApiTimeCost: 0,
          pageId: "abc-def",
          route: "/home/another",
          size: 0,
          type: "page",
        },
      ],
    });
  });
});
