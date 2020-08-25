import {
  BrickEventHandler,
  MessageConf,
  PluginRuntimeContext,
} from "@easyops/brick-types";
import {
  WebsocketMessageRequest,
  WebsocketMessageResponse,
} from "../websocket";
import {
  MessageBrickEventHandlerCallback,
  PluginWebSocketMessageEvent,
  PluginWebSocketMessageResponsePayload,
  PluginWebSocketMessageTopic,
} from "../websocket/interfaces";
import { BrickAndMessage } from "./LocationContext";
import { listenerFactory } from "../bindListeners";
import { createWebSocket } from "../websocket/WebSocket";
import minimatch from "minimatch";
import { WebSocketService } from "../websocket/WebSocketService";

let messageDispatcher: MessageDispatcher;

export function createMessageDispatcher(): MessageDispatcher {
  messageDispatcher = new MessageDispatcher();

  return messageDispatcher;
}

export function getMessageDispatcher(): MessageDispatcher {
  return messageDispatcher;
}

export class MessageDispatcher {
  private ws: WebSocketService;
  private context: PluginRuntimeContext;
  private messages: Map<string, BrickAndMessage[]> = new Map<
    string,
    BrickAndMessage[]
  >();
  private messageCallbackHandlers: Map<
    string,
    MessageBrickEventHandlerCallback[]
  > = new Map();
  private channels: Map<string, string> = new Map();

  create(
    brickAndMessages: BrickAndMessage[],
    context: PluginRuntimeContext
  ): void {
    if (Array.isArray(brickAndMessages)) {
      for (const { brick, match, message } of brickAndMessages) {
        ([] as MessageConf[]).concat(message).forEach((massageConf) => {
          const channel = massageConf.channel;
          const handler = { brick, match, message };
          if (this.messages.has(channel)) {
            this.messages.set(channel, [
              ...this.messages.get(channel),
              handler,
            ]);
          } else {
            this.messages.set(channel, [handler]);
          }
        });
      }
    }
    this.context = context;
  }

  reset(): void {
    this.messages = new Map();
    this.messageCallbackHandlers = new Map();
  }

  subscribe(
    channel: string,
    topic: PluginWebSocketMessageTopic,
    callback?: MessageBrickEventHandlerCallback
  ): void {
    const req = new WebsocketMessageRequest(
      PluginWebSocketMessageEvent.SUB,
      topic
    );
    this.setMessageCallbackHandlers(req.identity, callback);
    this.channels.set(req.topic, channel);
    this.send(req.data);
  }

  unsubscribe(
    channel: string,
    topic: PluginWebSocketMessageTopic,
    callback: MessageBrickEventHandlerCallback
  ): void {
    const req = new WebsocketMessageRequest(
      PluginWebSocketMessageEvent.UNSUB,
      topic
    );

    this.setMessageCallbackHandlers(req.identity, callback);
    this.send(req.data);
  }

  private send(data: string): void {
    if (!(this.ws instanceof WebSocketService)) {
      this.createWebsocketService();
    }
    this.ws.send(data);
  }

  private createWebsocketService(): void {
    this.ws = createWebSocket();
    this.ws.onMessage = (message) => {
      this.reducer(message);
    };
  }

  setMessageCallbackHandlers(
    identity: string,
    callback: MessageBrickEventHandlerCallback
  ): void {
    if (this.messageCallbackHandlers.get(identity)) {
      this.messageCallbackHandlers.set(identity, [
        ...this.messageCallbackHandlers.get(identity),
        ...[].concat(callback).filter(Boolean),
      ]);
    } else {
      this.messageCallbackHandlers.set(
        identity,
        [].concat(callback).filter(Boolean)
      );
    }
  }

  private reducer(response: WebsocketMessageResponse): void {
    const { event, message, topic } = response;
    switch (event) {
      case PluginWebSocketMessageEvent.MESSAGE_PUSH: {
        this.messagePushHandler(topic, message?.payload);
        break;
      }
      case PluginWebSocketMessageEvent.SUB_SUCCESS: {
        this.messageSubscribeResponseEventHandler(
          response,
          "success",
          PluginWebSocketMessageEvent.SUB_SUCCESS
        );
        break;
      }
      case PluginWebSocketMessageEvent.SUB_FAILED: {
        this.messageSubscribeResponseEventHandler(
          response,
          "error",
          PluginWebSocketMessageEvent.SUB_FAILED
        );
        break;
      }
      case PluginWebSocketMessageEvent.UNSUB_SUCCESS: {
        this.messageSubscribeResponseEventHandler(
          response,
          "success",
          PluginWebSocketMessageEvent.UNSUB_SUCCESS
        );
        break;
      }
      case PluginWebSocketMessageEvent.UNSUB_FAILED: {
        this.messageSubscribeResponseEventHandler(
          response,
          "error",
          PluginWebSocketMessageEvent.UNSUB_FAILED
        );
        break;
      }
      default: {
        // eslint-disable-next-line no-console
        console.error("Unknown message event:", event);
      }
    }
  }

  private dispatch(
    event: CustomEvent,
    element: HTMLElement,
    context: PluginRuntimeContext,
    handlers: BrickEventHandler[]
  ): void {
    for (const handler of handlers.filter(Boolean)) {
      listenerFactory(handler, context, element)(event);
    }
  }

  private getMessageHandlersByTopic(
    topic: PluginWebSocketMessageTopic
  ): BrickAndMessage[] {
    const finder = [...this.channels.keys()].find((key) => {
      const t = JSON.parse(key);
      // Support glob expressions
      return t.system === topic.system && minimatch(topic.topic, t.topic);
    });

    return this.messages.get(this.channels.get(finder));
  }
  private messagePushHandler(
    topic: string,
    payload: PluginWebSocketMessageResponsePayload
  ): void {
    const handlers = this.getMessageHandlersByTopic(JSON.parse(topic));

    if (Array.isArray(handlers)) {
      for (const brickAndMessage of handlers) {
        const event = new CustomEvent(
          PluginWebSocketMessageEvent.MESSAGE_PUSH,
          {
            detail: payload?.message,
          }
        );

        this.dispatch(
          event,
          brickAndMessage.brick.element,
          this.context,
          ([] as MessageConf[])
            .concat(brickAndMessage.message)
            .reduce((prev, curr) => prev.concat(curr?.handlers), [])
        );
      }
    }
  }

  private messageSubscribeResponseEventHandler(
    response: WebsocketMessageResponse,
    method: "success" | "error",
    event: PluginWebSocketMessageEvent
  ): void {
    const callbacks = this.messageCallbackHandlers.get(response.identity);
    if (Array.isArray(callbacks)) {
      for (const handler of callbacks) {
        const e = new CustomEvent(event, {
          detail: response.message,
        });

        this.dispatch(
          e,
          handler.brick,
          handler.context,
          [].concat(handler?.[method]).filter(Boolean)
        );
      }
    }
  }
}
