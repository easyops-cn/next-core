// @ts-ignore
import { fetch, __setReturnValue } from "./fetch";
import {
  http,
  HttpOptions,
  HttpFetchError,
  HttpParseError,
  HttpResponseError,
} from "./";

jest.mock("./fetch");

const spyOnFetch = fetch as jest.Mock;

type TestItem =
  | ["GET" | "DELETE" | "HEAD", string, [HttpOptions?]]
  | ["POST" | "PUT" | "PATCH", string, [any?, HttpOptions?]];

// Hack for snapshot testing.
(FormData.prototype as any).toJSON = function () {
  return "<FormData> " + JSON.stringify(Array.from(this.entries()));
};
(URLSearchParams.prototype as any).toJSON = function () {
  return "<URLSearchParams> " + this.toString();
};

describe("http", () => {
  afterEach(() => {
    spyOnFetch.mockClear();
  });

  const formData = new FormData();
  formData.append("for", "the throne");

  const batchTests: TestItem[] = [
    ["GET", "http://example.com", []],
    ["POST", "http://example.com", []],
    ["PUT", "http://example.com", []],
    ["PATCH", "http://example.com", []],
    ["DELETE", "http://example.com", []],
    ["HEAD", "http://example.com", []],
    [
      "GET",
      "http://example.com",
      [{ params: { lang: "zh-CN", type: null, category: undefined } }],
    ],
    [
      "GET",
      "http://example.com",
      [{ params: new URLSearchParams("lang=zh-CN") }],
    ],
    [
      "GET",
      "http://example.com",
      [
        {
          params: { lang: ["zh-CN", "en-US"], type: null, category: undefined },
        },
      ],
    ],
    [
      "GET",
      "http://example.com/for-good?token=secret",
      [{ params: { lang: "zh-CN", type: null, category: undefined } }],
    ],
    ["POST", "http://example.com", [{ for: "good" }]],
    [
      "POST",
      "http://example.com/for-good",
      [
        { for: "the throne" },
        { params: { lang: "zh-CN", type: null, category: undefined } },
      ],
    ],
    [
      "POST",
      "http://example.com/for-good",
      [
        { for: "the throne" },
        {
          params: new URLSearchParams("lang=zh-CN"),
        },
      ],
    ],
    [
      "POST",
      "http://example.com/for-good",
      [
        { for: "the throne" },
        { headers: { "x-requested-with": "XMLHttpRequest" } },
      ],
    ],
    [
      "POST",
      "http://example.com/for-good",
      [
        { for: "the throne" },
        { headers: new Headers({ "x-requested-with": "XMLHttpRequest" }) },
      ],
    ],
    ["POST", "http://example.com/for-good", ["for=the-throne"]],
    ["POST", "http://example.com/for-good", [formData]],
  ];

  it.each(batchTests)(
    "%s %s with %j should work",
    async (method: string, url: string, args: any[]) => {
      await http[method.toLowerCase() as "get"](url, ...args);
      expect(spyOnFetch.mock.calls[0]).toMatchSnapshot();
    }
  );

  it("should return raw text", async () => {
    __setReturnValue(Promise.resolve(new Response("raw-text")));
    const result = await http.get("http://example.com", {
      responseType: "text",
    });
    expect(result).toBe("raw-text");
  });

  it("should return blob", async () => {
    __setReturnValue(Promise.resolve(new Response(new Blob())));
    const result = await http.get("http://example.com", {
      responseType: "blob",
    });
    expect(result).toBeInstanceOf(Blob);
  });

  it("should return array buffer", async () => {
    __setReturnValue(Promise.resolve(new Response(new ArrayBuffer(1))));
    const result = await http.get("http://example.com", {
      responseType: "arrayBuffer",
    });
    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  it("should throw a HttpFetchError", async () => {
    __setReturnValue(Promise.reject(new Error("mock error")));
    expect.assertions(1);
    try {
      await http.get("http://example.com");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpFetchError);
    }
  });

  it("should throw a HttpResponseError", async () => {
    __setReturnValue(
      Promise.resolve(
        new Response('{"error":"oops"}', {
          status: 500,
        })
      )
    );
    expect.assertions(2);
    try {
      await http.get("http://example.com");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpResponseError);
      expect(e.responseJson).toEqual({
        error: "oops",
      });
    }
  });

  it("should throw a HttpParseError", async () => {
    __setReturnValue(Promise.resolve(new Response("non-json")));
    expect.assertions(1);
    try {
      await http.get("http://example.com");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpParseError);
    }
  });
});
