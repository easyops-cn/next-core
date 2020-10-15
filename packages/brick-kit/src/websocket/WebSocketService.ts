import { PluginWebSocketOptions } from "./interfaces";
import { WebsocketMessageResponse } from "./WebsocketMessageResponse";

export class WebSocketService {
  private retryCount = 0;
  private ws: WebSocket = null;
  private lockReconnect = false;
  public options: PluginWebSocketOptions;
  private messageQueue: Set<string> = new Set();
  public state: "initial" | "connecting" | "pending" | "finished" = "initial";

  private readonly defaultOptions: PluginWebSocketOptions = {
    url: null,
    reconnectTimeout: 1000,
    retryLimit: 6,
  };

  constructor(options: PluginWebSocketOptions) {
    this.options = { ...this.defaultOptions, ...options };
    this.createWebSocket();
  }

  get readyState(): number {
    return this.ws.readyState;
  }

  createWebSocket(): void {
    try {
      this.ws = new WebSocket(this.options.url);
      this.state = "connecting";
      this.init();
    } catch (e) {
      this.reconnect();
      /* istanbul ignore next */
      throw e;
    }
  }

  private init(): void {
    this.ws.onopen = () => {
      this.state = "pending";
      this.sendQueuedMessages();
      this.onOpen();
      this.retryCount = 0;
      this.options.reconnectTimeout = this.defaultOptions.reconnectTimeout;
    };

    this.ws.onclose = (event: CloseEvent) => {
      if (this.state === "finished") {
        this.onClose(event);
        // eslint-disable-next-line no-console
        console.warn("WebSocket was closed.", event);
      }
      // Error code 1000 means that the connection was closed normally.
      // Try to reconnect.
      if (event.code !== 1000) {
        /* istanbul ignore if */
        if (!navigator.onLine) {
          // eslint-disable-next-line no-console
          console.error(
            "You are offline. Please connect to the Internet and try again."
          );
        }
        this.reconnect();
      }
    };

    this.ws.onerror = (event: Event) => {
      this.onError(event);

      // eslint-disable-next-line no-console
      console.log("WebSocket encountered error: ", event);
      this.reconnect();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const response = new WebsocketMessageResponse(event.data);
      this.onMessage(response);
    };
  }

  private sendQueuedMessages(): void {
    if (this.messageQueue.size > 0) {
      [...this.messageQueue].forEach((message) => {
        this.messageQueue.delete(message);
        this.send(message);
      });
    }
  }

  send(data: string): void {
    if (this.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.messageQueue.add(data);
    }
  }

  reconnect(): void {
    if (
      this.options.retryLimit > 0 &&
      this.options.retryLimit <= this.retryCount
    ) {
      this.state = "finished";
      return;
    }
    if (this.lockReconnect) return;

    this.lockReconnect = true;
    this.retryCount++;
    this.onReconnect();

    // eslint-disable-next-line no-console
    console.warn("WebSocket server reconnecting...");
    setTimeout(() => {
      this.createWebSocket();
      this.lockReconnect = false;
      this.options.reconnectTimeout = this.options.reconnectTimeout * 2;
    }, this.options.reconnectTimeout);
  }

  close(): void {
    this.ws.close();
  }

  // Override hook function
  /* eslint-disable @typescript-eslint/no-empty-function */

  onOpen(): void {}

  // istanbul ignore next
  onClose(event: CloseEvent): void {}

  onError(event: Event): void {}

  onMessage(message: WebsocketMessageResponse): void {}

  onReconnect(): void {}
  /* eslint-enable @typescript-eslint/no-empty-function */
}
