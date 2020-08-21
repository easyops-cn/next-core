import WS from "jest-websocket-mock";
import { WebsocketMessageRequest } from "./WebsocketMessageRequest";
import { PluginWebSocketMessageEvent } from "./interfaces";
import { WebSocketService } from "./WebSocketService";
import { WebsocketMessageResponse } from "./WebsocketMessageResponse";

jest.useRealTimers();
jest.spyOn(console, "error");
jest.spyOn(console, "log");
describe("WebSocket Service", () => {
  let server: WS;
  let client: WebSocketService;
  const topic = {
    system: "pipeline",
    topic: "pipeline.task.running.001",
  };

  const req = new WebsocketMessageRequest(
    PluginWebSocketMessageEvent.SUB,
    topic
  );
  beforeEach(() => {
    server = new WS("ws://localhost:1234");
    client = new WebSocketService({
      url: "ws://localhost:1234",
      retryLimit: 5,
    });
  });

  afterEach(() => {
    WS.clean();
    client.close();
  });

  it("should send message to server", async () => {
    await server.connected;

    client.send(req.data);

    await expect(server).toReceiveMessage(req.data);
  });

  it("should receive message form websocket server", async () => {
    client.onMessage = jest.fn();
    await server.connected;
    server.send(
      `{"event":"TOPIC.SUB_SUCCESS","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001*"}}`
    );

    const call = (client.onMessage as jest.Mock).mock.calls[0][0];
    expect(call).toMatchObject({
      data:
        '{"event":"TOPIC.SUB_SUCCESS","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001*"}}',
      event: "TOPIC.SUB_SUCCESS",
      message: {
        event: "TOPIC.SUB_SUCCESS",
        payload: {
          source: "",
          system: "pipeline",
          topic: "pipeline.task.running.001*",
        },
        sessionID: "9336039e-2ae7-4caa-93ea-f1fae213ee3f",
      },
      topic: '{"system":"pipeline","topic":"pipeline.task.running.001*"}',
    });
    expect(call instanceof WebsocketMessageResponse).toBe(true);
  });

  it("should catch `createWebSocket` error", () => {
    const client2 = new WebSocketService({
      url: "ws://",
      retryLimit: 5,
    });

    expect(client2.createWebSocket).toThrow();
  });

  describe("WebSocket server get in trouble", () => {
    it("should resend message to server when websocket onopen", async () => {
      expect((client as any).unsendMessageSet.size).toBe(0);
      client.send(req.data);

      expect((client as any).unsendMessageSet.size).toBe(1);
      await server.connected;
      await expect(server).toReceiveMessage(req.data);

      server.send(
        `{"event":"TOPIC.SUB_SUCCESS","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
      );

      expect((client as any).unsendMessageSet.size).toBe(0);
    });

    it("should reconnect to server when webSocket server get in trouble", async () => {
      server.on("connection", (socket) => {
        socket.close({ wasClean: false, code: 1003, reason: "NOPE" });
      });
      client.onReconnect = jest.fn();

      jest.useFakeTimers();

      await server.connected;

      jest.advanceTimersByTime(2000);
      expect(client.onReconnect).toHaveBeenCalled();
    });
  });
});
