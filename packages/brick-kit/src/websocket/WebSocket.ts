import { WebSocketService } from "./WebSocketService";

let websocket: WebSocketService;

export const createWebSocket = (): WebSocketService => {
  websocket = new WebSocketService({
    url: `ws://${window.location.host}/api/websocket_service/v1/ws`,
    retryLimit: Infinity,
  });
  return websocket;
};

export function getWebSocket(): WebSocketService {
  return websocket;
}
