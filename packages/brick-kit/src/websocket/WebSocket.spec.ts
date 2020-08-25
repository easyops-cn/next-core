import { createWebSocket, getWebSocket } from "./WebSocket";
import { WebSocketService } from "./WebSocketService";

jest.mock("./WebSocketService");
describe("websocket", () => {
  it("should create websocket service", () => {
    const ws = createWebSocket();
    expect(ws instanceof WebSocketService).toBe(true);
  });

  it("should get websocket service instance", () => {
    const ws = getWebSocket();
    expect(ws instanceof WebSocketService).toBe(true);
  });
});
