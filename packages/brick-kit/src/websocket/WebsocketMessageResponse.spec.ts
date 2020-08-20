import { WebsocketMessageResponse } from "./WebsocketMessageResponse";

describe("WebsocketMessageResponse", () => {
  it("should work", () => {
    const res = new WebsocketMessageResponse(
      `{"event":"TOPIC.SUB_SUCCESS","sessionID":"a96f8afb-fdb1-42aa-8e15-dcbdae1d768c","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
    );
    expect(res).toMatchObject({
      topic: '{"system":"pipeline","topic":"pipeline.task.running.001"}',
      data:
        '{"event":"TOPIC.SUB_SUCCESS","sessionID":"a96f8afb-fdb1-42aa-8e15-dcbdae1d768c","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}',
      event: "TOPIC.SUB_SUCCESS",
      message: {
        event: "TOPIC.SUB_SUCCESS",
        sessionID: "a96f8afb-fdb1-42aa-8e15-dcbdae1d768c",
        payload: {
          source: "",
          system: "pipeline",
          topic: "pipeline.task.running.001",
        },
      },
    });

    expect(res.identity).toBe(
      '{"system":"pipeline","topic":"pipeline.task.running.001","event":"TOPIC.SUB"}'
    );

    const res2 = new WebsocketMessageResponse(
      `{"event":"CUSTOM.SUB_SUCCESS","sessionID":"a96f8afb-fdb1-42aa-8e15-dcbdae1d768c","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
    );

    expect(res2.identity).toBe(
      '{"system":"pipeline","topic":"pipeline.task.running.001","event":"CUSTOM.SUB_SUCCESS"}'
    );
  });
});
