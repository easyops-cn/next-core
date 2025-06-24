import { fetchEventSource } from "@microsoft/fetch-event-source";

type MessageIteratorResult<T> = IteratorResult<T, undefined>;
type ResolveIteratorResult<T> = (result: MessageIteratorResult<T>) => void;
type RejectIteratorResult = (reason: unknown) => void;
type PullQueueItem<T> = [
  resolve: ResolveIteratorResult<T>,
  reject: RejectIteratorResult,
];
type PushQueueItem<T> =
  | {
      ok: true;
      data: MessageIteratorResult<T>;
    }
  | {
      ok: false;
      reason: unknown;
    };

export interface Options<T> extends RequestInit {
  /**
   * 请求头。
   *
   * 注意不同于原生 `fetch` 的 `headers` 参数，这里仅支持字符串键值对。
   */
  headers?: Record<string, string>;

  /**
   * 将消息数据转换为迭代器结果。
   *
   * 默认实现将消息数据解析为 JSON 对象，特例：消息为 "[DONE]" 时表示结束。
   *
   * @param data 消息数据
   * @param event 事件
   * @returns 迭代器结果
   */
  converter?: (data: string, event: string) => MessageIteratorResult<T>;
}

/**
 * 将 SSE 事件流转换为异步迭代器。
 */
export async function createSSEStream<T = unknown>(
  url: string,
  options?: Options<T>
): Promise<AsyncIterableIterator<T>> {
  // Reference https://github.com/withspectrum/callback-to-async-iterator/blob/master/src/index.js
  const pushQueue: PushQueueItem<T>[] = [];
  const pullQueue: PullQueueItem<T>[] = [];
  let disposed = false;
  let closed = false;

  const { converter, ...fetchOptions } = options ?? {};

  await new Promise<null>((resolve, reject) => {
    fetchEventSource(url, {
      ...fetchOptions,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) {
          resolve(null);
        } else {
          // eslint-disable-next-line no-console
          console.error("open error", response.statusText);
          let text: string;
          try {
            text = await response.text();
          } catch {
            throw new Error(response.statusText);
          }

          let json: any;
          try {
            json = JSON.parse(text);
          } catch {
            // Do nothing
          }

          if (typeof json?.error === "string") {
            throw new Error(json.error);
          }
          throw new Error(text);
        }
      },
      onmessage(msg) {
        // istanbul ignore next
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.debug("[EventSource]", msg);
        }
        let data: MessageIteratorResult<T> | undefined;
        let reason: unknown;
        let ok = true;
        try {
          data = (converter ?? defaultConverter<T>)(msg.data, msg.event);
        } catch (e) {
          ok = false;
          reason = e;
        }
        if (pullQueue.length > 0) {
          const [resolve, reject] = pullQueue.shift()!;
          ok ? resolve(data!) : reject(reason);
        } else {
          pushQueue.push(
            ok ? { ok: true, data: data! } : { ok: false, reason }
          );
        }
      },
      onclose() {
        closed = true;
        earlyDone();
      },
      onerror(err) {
        throw err;
      },
    }).catch((reason) => {
      reject(reason);
      bailout(reason);
    });
  });

  function bailout(reason: unknown) {
    pullQueue.forEach(([_resolve, reject]) => reject(reason));
    dispose();
  }

  function earlyDone() {
    pullQueue.forEach(([resolve]) => resolve({ value: undefined, done: true }));
  }

  function dispose() {
    disposed = true;
    pullQueue.length = 0;
    pushQueue.length = 0;
  }

  return {
    next() {
      return disposed
        ? this.return!()
        : new Promise<MessageIteratorResult<T>>((resolve, reject) => {
            if (pushQueue.length > 0) {
              const result = pushQueue.shift()!;
              if (result.ok) {
                resolve(result.data);
              } else {
                reject(result.reason);
              }
            } else if (closed) {
              dispose();
              resolve({ value: undefined, done: true });
            } else {
              pullQueue.push([resolve, reject]);
            }
          });
    },
    return() {
      earlyDone();
      dispose();
      return Promise.resolve({ value: undefined, done: true });
    },
    throw(error) {
      earlyDone();
      dispose();
      return Promise.reject(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  } as AsyncIterableIterator<T>;
}

function defaultConverter<T>(
  data: string,
  event: string
): MessageIteratorResult<T> {
  if (event === "error") {
    // eslint-disable-next-line no-console
    console.error("Received error event:", data);
    let value: undefined | { error?: string };
    try {
      value = JSON.parse(data);
    } catch {
      // Ignore
    }
    throw new Error(typeof value?.error === "string" ? value.error : data);
  }

  // By default, `data: [DONE]` indicates the end of the stream
  if (data === "[DONE]") {
    return {
      value: undefined,
      done: true,
    };
  }

  if (data.startsWith("[ERROR]")) {
    // eslint-disable-next-line no-console
    console.error("Received error message:", data);
    throw new Error(data);
  }

  try {
    const value = JSON.parse(data);
    return {
      value,
      done: false,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse message:", data);
    throw e;
  }
}
