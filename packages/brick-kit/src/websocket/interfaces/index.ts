import {
  BrickEventHandlerCallback,
  PluginRuntimeContext,
} from "@easyops/brick-types";

export interface PluginWebSocketOptions {
  url: string;
  reconnectTimeout?: number;
  retryLimit?: number | null;
}

export enum PluginWebSocketMessageEvent {
  START_SESSION = "SYSTEM.START_SESSION",
  SESSION_STARTED = "SYSTEM.SESSION_STARTED",
  SESSION_FINISHED = "SYSTEM.SESSION_FINISHED",
  SESSION_RESTORE = "SYSTEM.SESSION_RESTORE",
  SESSION_RESTORE_SUCCESS = "SYSTEM.SESSION_RESTORE_SUCCESS",
  SESSION_RESTORE_FAILED = "SYSTEM.SESSION_RESTORE_FAILED",
  SUB = "TOPIC.SUB",
  SUB_SUCCESS = "TOPIC.SUB_SUCCESS",
  SUB_FAILED = "TOPIC.SUB_FAILED",
  UNSUB = "TOPIC.UNSUB",
  UNSUB_SUCCESS = "TOPIC.UNSUB_SUCCESS",
  UNSUB_FAILED = "TOPIC.UNSUB_FAILED",
  MESSAGE_PUSH = "MESSAGE.PUSH",
}

export interface PluginWebSocketMessage<T> {
  event: PluginWebSocketMessageEvent;
  sessionId?: string;
  payload: T;
}

export interface PluginWebSocketMessageTopic {
  source?: string;
  system: string;
  topic: string;
}

export interface PluginWebSocketMessageResponsePayload
  extends PluginWebSocketMessageTopic {
  expire: number;
  message: Record<string, any>;
}

export interface MessageBrickEventHandlerCallback
  extends Pick<BrickEventHandlerCallback, "success" | "error"> {
  brick: HTMLElement;
  context: PluginRuntimeContext;
}
