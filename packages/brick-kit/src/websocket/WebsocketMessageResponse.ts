import {
  PluginWebSocketMessage,
  PluginWebSocketMessageEvent,
  PluginWebSocketMessageResponsePayload,
} from "./interfaces";

export class WebsocketMessageResponse {
  topic: string;
  data: string;
  event: PluginWebSocketMessageEvent;
  message: PluginWebSocketMessage<PluginWebSocketMessageResponsePayload>;

  constructor(response: string) {
    this.data = response;
    this.message = JSON.parse(response);
    this.event = this.message.event;
    const { system, topic } = this.message.payload;
    this.topic = JSON.stringify({ system, topic });
  }

  get identity(): string {
    const { system, topic } = this.message.payload;
    let event;
    switch (this.event) {
      case PluginWebSocketMessageEvent.SUB_SUCCESS:
      case PluginWebSocketMessageEvent.SUB_FAILED:
        event = PluginWebSocketMessageEvent.SUB;
        break;
      case PluginWebSocketMessageEvent.UNSUB_SUCCESS:
      case PluginWebSocketMessageEvent.UNSUB_FAILED:
        event = PluginWebSocketMessageEvent.UNSUB;
        break;
      default:
        event = this.event;
    }
    return JSON.stringify({
      system,
      topic,
      event,
    });
  }
}
