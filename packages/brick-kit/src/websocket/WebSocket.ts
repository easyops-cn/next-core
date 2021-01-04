import { WebSocketService } from "./WebSocketService";

let websocket: WebSocketService;

export const createWebSocket = (): WebSocketService => {
  if (!websocket) {
    const base = document.querySelector("base");
    const basePathname = base ? new URL(base.href).pathname : "/";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    websocket = new WebSocketService({
      url: `${protocol}//${window.location.host}${basePathname}api/websocket_service/v1/ws`,
    });
  }
  return websocket;
};

export function getWebSocket(): WebSocketService {
  return websocket;
}
