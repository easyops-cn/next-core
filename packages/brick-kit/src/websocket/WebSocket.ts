import { getBasePath } from "../internal/getBasePath";
import { WebSocketService } from "./WebSocketService";

let websocket: WebSocketService;

export const createWebSocket = (): WebSocketService => {
  if (!websocket) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    websocket = new WebSocketService({
      url: `${protocol}//${
        window.location.host
      }${getBasePath()}api/websocket_service/v1/ws`,
    });
  }
  return websocket;
};

export function getWebSocket(): WebSocketService {
  return websocket;
}
