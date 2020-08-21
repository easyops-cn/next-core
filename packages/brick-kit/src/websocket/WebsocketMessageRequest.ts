import {
  PluginWebSocketMessageTopic,
  PluginWebSocketMessage,
  PluginWebSocketMessageEvent,
} from "./interfaces";

export class WebsocketMessageRequest {
  topic: string;
  data: string;
  event: PluginWebSocketMessageEvent;
  message: PluginWebSocketMessage<PluginWebSocketMessageTopic>;
  constructor(
    event: PluginWebSocketMessageEvent,
    topic: PluginWebSocketMessageTopic
  ) {
    this.event = event;
    this.topic = JSON.stringify(topic);
    this.message = {
      event: event,
      payload: topic,
    };
    this.data = JSON.stringify(this.message);
  }

  get identity(): string {
    const { system, topic } = this.message.payload;
    return JSON.stringify({
      system,
      topic,
      event: this.event,
    });
  }
}
