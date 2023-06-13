import { getBasePath } from "@next-core/runtime";
import {
  MessageService,
  type MessageListener,
  CloseListener,
} from "./MessageService.js";

interface MessageResponse {
  event:
    | "TOPIC.SUB_SUCCESS"
    | "TOPIC.SUB_FAILED"
    | "TOPIC.UNSUB_SUCCESS"
    | "TOPIC.UNSUB_FAILED"
    | "MESSAGE.PUSH";
  payload: MessagePayload;
}

interface MessagePayload {
  source?: string;
  system: string;
  topic: string;
  message?: unknown;
}

export class MessageDispatcher {
  #_ms: MessageService | undefined;
  #memoizedChannels = {
    sub: new Map<string, Promise<unknown>>(),
    unsub: new Map<string, Promise<unknown>>(),
  };
  #channelPayloads = new Map<string, string>();

  get #ms(): MessageService {
    if (!this.#_ms) {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${
        window.location.host
      }${getBasePath()}api/websocket_service/v1/ws`;
      this.#_ms = new MessageService(url);
    }
    return this.#_ms;
  }

  async subscribe(channel: string, payload: MessagePayload): Promise<unknown> {
    const stringifiedPayload = JSON.stringify(payload);
    return this.#subOrUnsub("sub", channel, payload, stringifiedPayload);
  }

  unsubscribe(channel: string): Promise<unknown> {
    const stringifiedPayload = this.#channelPayloads.get(channel);
    if (!stringifiedPayload) {
      const msg = `The message channel to unsubscribe "${channel}" is not found`;
      // eslint-disable-next-line no-console
      console.error(msg);
      return Promise.reject(new Error(msg));
    }

    const payload = JSON.parse(stringifiedPayload);
    const result = this.#subOrUnsub(
      "unsub",
      channel,
      payload,
      stringifiedPayload
    );

    this.#memoizedChannels.sub.delete(stringifiedPayload);

    result.then(() => {
      this.#channelPayloads.delete(channel);
    });

    return result;
  }

  onMessage(channel: string, listener: MessageListener): void {
    const stringifiedPayload = this.#channelPayloads.get(channel);
    if (!stringifiedPayload) {
      // eslint-disable-next-line no-console
      console.error(`Message channel: "${channel}" not found`);
      return;
    }

    this.#ms.onMessage<MessageResponse>((response) => {
      if (
        response.event === "MESSAGE.PUSH" &&
        stringifiedPayload === getIdentity(response.payload)
      ) {
        listener(response.payload.message);
      }
    });
  }

  onClose(listener: CloseListener): void {
    this.#ms.onClose(listener);
  }

  reset(): void {
    this.#memoizedChannels.sub.clear();
    this.#memoizedChannels.unsub.clear();
    this.#channelPayloads.clear();
    this.#_ms?.reset();
  }

  #subOrUnsub(
    type: "sub" | "unsub",
    channel: string,
    payload: MessagePayload,
    stringifiedPayload: string
  ): Promise<unknown> {
    const hit = this.#memoizedChannels[type].get(stringifiedPayload);
    if (hit) {
      return hit;
    }
    const request = {
      event: type === "sub" ? "TOPIC.SUB" : "TOPIC.UNSUB",
      payload,
    };
    const promise = new Promise((resolve, reject) => {
      const identity = getIdentity(payload);
      this.#ms.onMessage<MessageResponse>((response) => {
        const isSuccess =
          response.event ===
          (type === "sub" ? "TOPIC.SUB_SUCCESS" : "TOPIC.UNSUB_SUCCESS");
        const isFailed =
          response.event ===
          (type === "sub" ? "TOPIC.SUB_FAILED" : "TOPIC.UNSUB_FAILED");
        if (
          (isSuccess || isFailed) &&
          // Put this after event type checks, to prevent unnecessary
          // JSON stringify.
          identity === getIdentity(response.payload)
        ) {
          (isSuccess ? resolve : reject)(response);
        }
      });
      this.#ms.send(request);
    });

    if (type === "sub") {
      this.#channelPayloads.set(channel, stringifiedPayload);
    }
    this.#memoizedChannels[type].set(stringifiedPayload, promise);
    return promise;
  }
}

function getIdentity(payload: MessagePayload) {
  const { system, topic } = payload;
  return JSON.stringify({ system, topic });
}
