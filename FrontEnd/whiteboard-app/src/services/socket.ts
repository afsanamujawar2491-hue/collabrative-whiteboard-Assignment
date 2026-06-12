import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { BoardMessage } from "../types";

const WS_URL = "http://localhost:8081/whiteboard";

let tokenProvider: () => string | undefined = () => undefined;

export function setSocketTokenProvider(provider: () => string | undefined) {
  tokenProvider = provider;
}

export function createStompClient(): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    debug: () => {},
  });

  client.beforeConnect = () => {
    const token = tokenProvider();
    if (token) {
      client.connectHeaders = { Authorization: `Bearer ${token}` };
    }
  };

  return client;
}

export function publishDraw(client: Client, message: BoardMessage) {
  client.publish({
    destination: "/app/draw",
    body: JSON.stringify(message),
  });
}

export function publishChat(client: Client, message: BoardMessage) {
  client.publish({
    destination: "/app/chat",
    body: JSON.stringify(message),
  });
}

export function publishCursor(client: Client, message: BoardMessage) {
  client.publish({
    destination: "/app/cursor",
    body: JSON.stringify(message),
  });
}
