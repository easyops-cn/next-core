import { WebSocketService } from "./WebSocketService";

let websocket: WebSocketService;

export const createWebSocket = (): WebSocketService => {
  if (!websocket) {
    const baseHref = process.env.NODE_ENV === "production" ? "/next/" : "/";
    websocket = new WebSocketService({
      url: `ws://${window.location.host}${baseHref}api/websocket_service/v1/ws`,
    });
  }
  return websocket;
};

export function getWebSocket(): WebSocketService {
  return websocket;
}
