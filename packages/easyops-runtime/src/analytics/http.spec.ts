import {
  describe,
  test,
  beforeEach,
  afterEach,
  jest,
  expect,
} from "@jest/globals";
import "whatwg-fetch";
import {
  HttpResponseError,
  type HttpRequestConfig,
  HttpParseError,
  HttpAbortError,
} from "@next-core/http";
import { onRequest, onResponse, onResponseError } from "./http.js";
import { pushApiMetric } from "./analytics.js";

jest.mock("./analytics.js");
jest.mock("../auth.js", () => ({
  getAuth() {
    return {
      userInstanceId: "abc",
      username: "easyops",
    };
  },
}));

describe("analytics.http", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-09-11 14:40:00.456"));
  });

  afterEach(() => {
    jest.setSystemTime();
    jest.useRealTimers();
  });

  test("response ok", () => {
    const config: HttpRequestConfig = {
      url: "http://localhost/api/test",
      method: "GET",
    };
    onRequest(config);
    expect(config).toMatchObject({
      url: "http://localhost/api/test",
      method: "GET",
    });
    jest.advanceTimersByTime(123);
    onResponse(
      {
        data: null,
        status: 200,
        statusText: "OK",
        headers: new Headers([
          ["x-b3-traceid", "fake-b3-trace-id"],
          ["content-length", "42"],
        ]),
      },
      config
    );
    expect(pushApiMetric).toBeCalledTimes(1);
    expect(pushApiMetric).toBeCalledWith({
      _ver: 1694414400456,
      api: "http://localhost/api/test",
      code: -1,
      duration: 123,
      et: 1694414400579,
      msg: "",
      page: "http://localhost/",
      size: 42,
      st: 1694414400456,
      status: 200,
      time: 1694414400,
      traceId: "fake-b3-trace-id",
      type: "api",
      uid: "abc",
      username: "easyops",
    });
  });

  test("response error", async () => {
    const config: HttpRequestConfig = {
      url: "http://localhost/api/test",
      method: "GET",
    };
    onRequest(config);
    jest.advanceTimersByTime(123);
    const error = new HttpResponseError(
      new Response("", {
        status: 400,
        statusText: "Bad Request",
      }),
      {
        code: 10013,
        message: "Invalid arguments",
      }
    );
    onResponseError(error, config).catch((reason) => {
      expect(reason).toBe(error);
    });
    expect(pushApiMetric).toBeCalledTimes(1);
    expect(pushApiMetric).toBeCalledWith({
      _ver: 1694414400456,
      api: "http://localhost/api/test",
      code: 10013,
      duration: 123,
      et: 1694414400579,
      msg: "Invalid arguments",
      page: "http://localhost/",
      size: -1,
      st: 1694414400456,
      status: 400,
      time: 1694414400,
      traceId: "",
      type: "api",
      uid: "abc",
      username: "easyops",
    });
    expect.assertions(3);
  });

  test("parse error", async () => {
    const config: HttpRequestConfig = {
      url: "http://localhost/api/test",
      method: "GET",
    };
    onRequest(config);
    jest.advanceTimersByTime(123);
    const error = new HttpParseError(
      new Response("", {
        status: 200,
        statusText: "OK",
      })
    );
    onResponseError(error, config).catch((reason) => {
      expect(reason).toBe(error);
    });
    expect(pushApiMetric).toBeCalledTimes(1);
    expect(pushApiMetric).toBeCalledWith({
      _ver: 1694414400456,
      api: "http://localhost/api/test",
      code: -1,
      duration: 123,
      et: 1694414400579,
      msg: "",
      page: "http://localhost/",
      size: -1,
      st: 1694414400456,
      status: 200,
      time: 1694414400,
      traceId: "",
      type: "api",
      uid: "abc",
      username: "easyops",
    });
    expect.assertions(3);
  });

  test("arbitrary error", async () => {
    const config: HttpRequestConfig = {
      url: "http://localhost/api/test",
      method: "GET",
    };
    onRequest(config);
    jest.advanceTimersByTime(123);
    const error = new Error("oops");
    onResponseError(error, config).catch((reason) => {
      expect(reason).toBe(error);
    });
    expect(pushApiMetric).toBeCalledTimes(1);
    expect(pushApiMetric).toBeCalledWith({
      _ver: 1694414400456,
      api: "http://localhost/api/test",
      code: -1,
      duration: 123,
      et: 1694414400579,
      msg: "",
      page: "http://localhost/",
      size: -1,
      st: 1694414400456,
      status: undefined,
      time: 1694414400,
      traceId: "",
      type: "api",
      uid: "abc",
      username: "easyops",
    });
    expect.assertions(3);
  });

  test("request aborted", async () => {
    const config: HttpRequestConfig = {
      url: "http://localhost/api/test",
      method: "GET",
    };
    onRequest(config);
    jest.advanceTimersByTime(123);
    const error = new HttpAbortError("");
    onResponseError(error, config).catch((reason) => {
      expect(reason).toBe(error);
    });
    expect(pushApiMetric).toBeCalledTimes(0);
    expect.assertions(2);
  });
});
