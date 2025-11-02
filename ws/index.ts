import { createClient } from "redis";
import { WebSocketServer, WebSocket } from "ws";

const redis = createClient({
  url: "redis://redis_service:6379",
});
const websocket = new WebSocketServer({ port: 8080 });
const client = new Map<WebSocket, Set<string>>();

export const Channels = ["SOL", "ETH", "BTC"];

const start = async () => {
  await redis.connect();

  Channels.forEach((ch) => {
    redis.subscribe(ch, (data) => {
      client.forEach((symbs, ws: WebSocket) => {
        if (symbs.has(ch)) {
          ws.send(data);
        }
      });
    });
  });

  websocket.on("connection", (ws: WebSocket) => {
    client.set(ws, new Set());
    ws.on("message", (msg) => {
      const message = JSON.parse(msg.toString());
      if (message.type === "SUBSCRIBE") {
        if (!client.has(ws)) {
          client.set(ws, new Set());
        }
        const symbs = client.get(ws);
        symbs?.add(message.symbol);
      }

      if (message.type === "UNSUBSCRIBE") {
        const symbs = client.get(ws);
        symbs?.delete(message.symbol);
        if (symbs?.size === 0) {
          client.delete(ws);
        }
      }
    });
  });
};

start().catch(console.error);
