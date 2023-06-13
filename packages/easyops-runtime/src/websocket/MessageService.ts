export type MessageListener<T = unknown> = (response: T) => void;
export type CloseListener = () => void;

const RETRY_TIMEOUT_UNIT = 1000;
const RETRY_LIMIT = 6;

export class MessageService {
  #url: string;
  #ws: WebSocket | undefined;
  #queuedMessages: string[] = [];
  #messageListeners = new Set<MessageListener>();
  #closeListeners = new Set<CloseListener>();
  #retryCount = 0;
  #closed = false;

  constructor(url: string) {
    this.#url = url;
  }

  #connect(): WebSocket {
    // eslint-disable-next-line no-console
    console.log("WebSocket connecting ...");
    const ws = new WebSocket(this.#url);
    ws.addEventListener("open", (e) => {
      // eslint-disable-next-line no-console
      console.log("WebSocket open:", e);
      this.#retryCount = 0;
      for (const msg of this.#queuedMessages) {
        ws.send(msg);
      }
      this.#queuedMessages.length = 0;
    });
    ws.addEventListener("close", (e) => {
      if (this.#closed) {
        return;
      }
      // eslint-disable-next-line no-console
      console.log("WebSocket close:", e);
      for (const listener of this.#closeListeners) {
        listener();
      }
      // Error code 1000 means that the connection was closed normally.
      if (e.code !== 1000) {
        this.#reconnect();
      }
    });
    ws.addEventListener("error", (e) => {
      // No need to reconnect in error event listener,
      // there will always be a close event along with the error event.
      // eslint-disable-next-line no-console
      console.error("WebSocket error:", e);
    });
    ws.addEventListener("message", (e: MessageEvent<string>) => {
      const response = JSON.parse(e.data);
      for (const listener of this.#messageListeners) {
        listener(response);
      }
    });
    return ws;
  }

  #reconnect() {
    // istanbul ignore next: currently can't mock this
    if (this.#retryCount >= RETRY_LIMIT) {
      // eslint-disable-next-line no-console
      console.error("WebSocket connect retry limit exceeded");
      return;
    }
    // Double the timeout for each retry
    const delay = Math.pow(2, this.#retryCount) * RETRY_TIMEOUT_UNIT;
    // eslint-disable-next-line no-console
    console.log("WebSocket will reconnect after %d seconds", delay / 1000);
    setTimeout(() => {
      this.#retryCount++;
      this.#ws = this.#connect();
    }, delay);
  }

  send(data: unknown): void {
    // Connect when data is sent for the first time
    if (!this.#ws) {
      this.#ws = this.#connect();
    }
    const stringifiedData = JSON.stringify(data);
    if (this.#ws.readyState === WebSocket.OPEN) {
      this.#ws.send(stringifiedData);
    } else {
      this.#queuedMessages.push(stringifiedData);
    }
  }

  onMessage<T = unknown>(listener: MessageListener<T>) {
    this.#messageListeners.add(listener as MessageListener<unknown>);
  }

  onClose(listener: CloseListener) {
    this.#closeListeners.add(listener);
  }

  reset() {
    this.#queuedMessages.length = 0;
    this.#messageListeners.clear();
    this.#closeListeners.clear();
  }

  close() {
    this.#closed = true;
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.close();
    }
  }
}
