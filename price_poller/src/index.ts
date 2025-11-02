import { WebSocket } from "ws";
import { createClient } from "redis";
import { pushToRedis } from "./redisops";
import { toInternalPrice } from "./utils";
import { savetradeBatch } from "./dbops";

const BATCH_TIMINIGS = 10000; //ms
let tradeBatch: any = [];

async function main() {
  const redis = await createClient({
    url: "redis://redis_service:6379",
  }).connect();
  console.log("redis is connected");

  const batchprocess = setInterval(() => {
    const batchsave = [...tradeBatch];
    tradeBatch = [];
    savetradeBatch(batchsave);
  }, BATCH_TIMINIGS);

  const ws = new WebSocket("wss://stream.binance.com:9443/ws");
  ws.on("open", () => {
    console.log("Connected to the redis db stream of binance ");
    ws.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: ["btcusdt@aggTrade", "ethusdt@aggTrade", "solusdt@aggTrade"],
        id: 1,
      }),
    );
  });

  ws.on("message", (data: string) => {
    const messages = JSON.parse(data);
    if (messages.e === "aggTrade") {
      const intPrice = toInternalPrice(messages.p);
      const intQty = toInternalPrice(messages.q);

      pushToRedis(redis, intPrice, messages.s, new Date(messages.T));
      tradeBatch.push({
        symbol: messages.s,
        price: intPrice,
        tradeId: BigInt(messages.a),
        timestamp: new Date(messages.T),
        quantity: intQty,
      });
    }
  });

  ws.on("error", (err) => {
    console.log("error form the websocket" + err);
  });

  ws.on("close", () => {
    console.log("server is closed ");
    clearInterval(batchprocess);
    savetradeBatch(tradeBatch);
  });
}

main();
