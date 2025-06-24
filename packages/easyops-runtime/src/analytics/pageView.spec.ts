import {
  describe,
  test,
  beforeEach,
  afterEach,
  jest,
  expect,
} from "@jest/globals";
import { create } from "./pageView.js";
import {
  createPageView,
  earlyFinishPageView,
  finishPageView,
} from "./analytics.js";

jest.mock("./analytics.js");
jest.mock("../auth.js", () => ({
  getAuth() {
    return {
      userInstanceId: "abc",
      username: "easyops",
    };
  },
}));
const dispatchEvent = jest.spyOn(window, "dispatchEvent");

describe("analytics.pageView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-09-11 14:40:00.456"));
  });

  afterEach(() => {
    jest.setSystemTime();
    jest.useRealTimers();
  });

  test("finish ok", () => {
    const finish = create();
    expect(createPageView).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(123);
    finish({
      status: "ok",
      path: "/home/:objectId",
      pageTitle: "DevOps 管理专家",
    });
    expect(earlyFinishPageView).not.toHaveBeenCalled();
    expect(finishPageView).toHaveBeenCalledTimes(1);
    expect(finishPageView).toHaveBeenCalledWith({
      _ver: 1694414400456,
      et: 1694414400579,
      lt: 123,
      page: "http://localhost/",
      pageTitle: "DevOps 管理专家",
      route: "/home/:objectId",
      st: 1694414400456,
      time: 1694414400,
      type: "page",
      username: "easyops",
    });
    expect(dispatchEvent).toHaveBeenCalled();
  });

  test("finish failed", () => {
    const finish = create();
    expect(createPageView).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(123);
    finish({ status: "failed" });
    expect(finishPageView).not.toHaveBeenCalled();
    expect(earlyFinishPageView).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});
