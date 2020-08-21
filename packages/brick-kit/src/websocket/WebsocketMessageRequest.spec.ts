import { WebsocketMessageRequest } from "./WebsocketMessageRequest";
import { PluginWebSocketMessageEvent } from "./interfaces";

describe("WebsocketMessageRequest", () => {
  it("should work", () => {
    const topic = {
      system: "pipeline",
      topic: "pipeline.task.running.001",
    };
    const req = new WebsocketMessageRequest(
      PluginWebSocketMessageEvent.SUB,
      topic
    );
    expect(req).toMatchObject({
      data:
        '{"event":"TOPIC.SUB","payload":{"system":"pipeline","topic":"pipeline.task.running.001"}}',
      event: "TOPIC.SUB",
      message: {
        event: "TOPIC.SUB",
        payload: {
          system: "pipeline",
          topic: "pipeline.task.running.001",
        },
      },
      topic: '{"system":"pipeline","topic":"pipeline.task.running.001"}',
    });

    expect(req.identity).toBe(
      '{"system":"pipeline","topic":"pipeline.task.running.001","event":"TOPIC.SUB"}'
    );
  });
});
