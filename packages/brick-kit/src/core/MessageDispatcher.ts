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
  private messageCallBackHandlerMap: Map<
    string,
    MessageBrickEventHandlerCallback[]
  > = new Map();

  create(
    brickAndMessages: BrickAndMessage[],
    context: PluginRuntimeContext
  ): void {
    if (Array.isArray(brickAndMessages)) {
      for (const { brick, match, message } of brickAndMessages) {
        ([] as MessageConf[]).concat(message).forEach((massageConf) => {
          const topic = JSON.stringify({
            system: massageConf.channel.system,
            topic: massageConf.channel.topic,
          });
          const handler = { brick, match, message };
          if (this.messages.has(topic)) {
            this.messages.set(topic, [...this.messages.get(topic), handler]);
          } else {
            this.messages.set(topic, [handler]);
          }
        });
      }
    }
    this.context = context;
  }

  reset(): void {
    this.messages = new Map();
    this.messageCallBackHandlerMap = new Map();
  }

  subscribe(
    topic: PluginWebSocketMessageTopic,
    callback?: MessageBrickEventHandlerCallback
  ): void {
    const req = new WebsocketMessageRequest(
      PluginWebSocketMessageEvent.SUB,
      topic
    );
    this.setMessageCallBackHandlerMap(req.identity, callback);

    this.send(req.data);
  }

  unsubscribe(
    topic: PluginWebSocketMessageTopic,
    callback: MessageBrickEventHandlerCallback
  ): void {
    const req = new WebsocketMessageRequest(
      PluginWebSocketMessageEvent.UNSUB,
      topic
    );

    this.setMessageCallBackHandlerMap(req.identity, callback);
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

  setMessageCallBackHandlerMap(
    identity: string,
    callback: MessageBrickEventHandlerCallback
  ): void {
    if (this.messageCallBackHandlerMap.get(identity)) {
      this.messageCallBackHandlerMap.set(identity, [
        ...this.messageCallBackHandlerMap.get(identity),
        ...[].concat(callback).filter(Boolean),
      ]);
    } else {
      this.messageCallBackHandlerMap.set(
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
    const finder = [...this.messages.keys()].find((key) => {
      const t = JSON.parse(key);
      // Support glob expressions
      return t.system === topic.system && minimatch(topic.topic, t.topic);
    });

    return this.messages.get(finder);
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
    const callbacks = this.messageCallBackHandlerMap.get(response.identity);
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
