import { fetchEventSource } from "@microsoft/fetch-event-source";
import { describe, test, expect } from "@jest/globals";
import { createSSEStream } from "./createSSEStream.js";

jest.mock("@microsoft/fetch-event-source");
const consoleError = jest.spyOn(console, "error").mockReturnValue();
const mockFetchEventSource = fetchEventSource as jest.MockedFunction<
  typeof fetchEventSource
>;

describe("createSSEStream", () => {
  const url = "https://example.com/sse";

  test("should return an async iterable iterator", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"2"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: "[DONE]" });
    });
    const iterator = await createSSEStream<string>(url);
    const messages: string[] = [];
    for await (const value of iterator) {
      messages.push(value);
    }
    expect(messages).toEqual(["1", "2"]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("close early", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage, onclose } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"2"' });
      await Promise.resolve();
      onclose?.();
    });
    const iterator = await createSSEStream<string>(url);
    const messages: string[] = [];
    for await (const value of iterator) {
      messages.push(value);
    }
    expect(messages).toEqual(["1", "2"]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("queue", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage, onclose } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"2"' });
      await Promise.resolve();
      onclose?.();
      // onmessage?.({ id: "", event: "", data: '[DONE]' });
    });
    const iterator = await createSSEStream<string>(url);
    const messages: string[] = [];
    await Promise.resolve();
    await Promise.resolve();
    for await (const value of iterator) {
      messages.push(value);
    }
    expect(messages).toEqual(["1", "2"]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("manually return", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"2"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: "[DONE]" });
    });
    const iterator = await createSSEStream<string>(url);
    let value = await iterator.next();
    expect(value).toEqual({ done: false, value: "1" });
    value = await iterator.return!();
    expect(value).toEqual({ done: true, value: undefined });
    value = await iterator.next();
    expect(value).toEqual({ done: true, value: undefined });
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("manually throw", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"2"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: "[DONE]" });
    });
    const iterator = await createSSEStream<string>(url);
    let value = await iterator.next();
    expect(value).toEqual({ done: false, value: "1" });
    expect(iterator.throw!(new Error("Oops"))).rejects.toMatchInlineSnapshot(
      `[Error: Oops]`
    );
    value = await iterator.next();
    expect(value).toEqual({ done: true, value: undefined });
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("open error", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onerror } = options;
      await Promise.resolve();
      try {
        await onopen?.({ ok: false, statusText: "Internal Error" } as Response);
      } catch (e) {
        await onerror?.(e);
      }
    });
    await expect(createSSEStream(url)).rejects.toMatchInlineSnapshot(
      `[Error: Internal Error]`
    );
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("open error", "Internal Error");
  });

  test("open error with json error", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onerror } = options;
      await Promise.resolve();
      try {
        await onopen?.({
          ok: false,
          statusText: "Internal Error",
          text: () =>
            Promise.resolve(
              JSON.stringify({
                error: "Something went wrong",
              })
            ),
        } as Response);
      } catch (e) {
        await onerror?.(e);
      }
    });
    await expect(createSSEStream(url)).rejects.toMatchInlineSnapshot(
      `[Error: Something went wrong]`
    );
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("open error", "Internal Error");
  });

  test("open error with non-json error", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onerror } = options;
      await Promise.resolve();
      try {
        await onopen?.({
          ok: false,
          statusText: "Internal Error",
          text: () => Promise.resolve("Oops"),
        } as Response);
      } catch (e) {
        await onerror?.(e);
      }
    });
    await expect(createSSEStream(url)).rejects.toMatchInlineSnapshot(
      `[Error: Oops]`
    );
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("open error", "Internal Error");
  });

  test("message error", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: "[ERROR]: Oops" });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: "[DONE]" });
    });
    const iterator = await createSSEStream<string>(url);
    await expect(async () => {
      for await (const _value of iterator) {
        // Do nothing
      }
    }).rejects.toMatchInlineSnapshot(`[Error: [ERROR]: Oops]`);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Received error message:",
      "[ERROR]: Oops"
    );
  });

  test("early message error", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: "Oops" });
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: "[DONE]" });
    });
    const iterator = await createSSEStream<string>(url);
    await Promise.resolve();
    await Promise.resolve();
    await expect(async () => {
      for await (const _value of iterator) {
        // Do nothing
      }
    }).rejects.toMatchInlineSnapshot(
      `[SyntaxError: Unexpected token 'O', "Oops" is not valid JSON]`
    );
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to parse message:",
      "Oops"
    );
  });

  test("error event", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "error", data: '{"error":"Oops"}' });
    });
    const iterator = await createSSEStream<string>(url);
    await expect(async () => {
      for await (const _value of iterator) {
        // Do nothing
      }
    }).rejects.toMatchInlineSnapshot(`[Error: Oops]`);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Received error event:",
      '{"error":"Oops"}'
    );
  });

  test("error event that can not be parsed as JSON", async () => {
    mockFetchEventSource.mockImplementation(async (_url, options) => {
      const { onopen, onmessage } = options;
      await Promise.resolve();
      await onopen?.({ ok: true } as Response);
      await Promise.resolve();
      onmessage?.({ id: "", event: "", data: '"1"' });
      await Promise.resolve();
      onmessage?.({ id: "", event: "error", data: "Yaks" });
    });
    const iterator = await createSSEStream<string>(url);
    await expect(async () => {
      for await (const _value of iterator) {
        // Do nothing
      }
    }).rejects.toMatchInlineSnapshot(`[Error: Yaks]`);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("Received error event:", "Yaks");
  });
});
