import { fromInternalPrice, toInternalPrice } from "./utils";

type SymbolMapKey = "SOLUSDT" | "ETHUSDT" | "BTCUSDT";

export function pushToRedis(
  redis: any,
  value: any,
  type: SymbolMapKey,
  time: any,
) {
  let symbolmap = {
    SOLUSDT: "SOL",
    ETHUSDT: "ETH",
    BTCUSDT: "BTC",
  };
  //float

  const realVal = fromInternalPrice(value);
  const ask = toInternalPrice(Number((realVal * 1.01).toFixed(2)));
  const bid = toInternalPrice(Number(realVal.toFixed(2)));

  redis.publish(
    symbolmap[type],
    JSON.stringify({
      symbol: symbolmap[type],
      askPrice: ask,
      bidPrice: bid,
      decimals: 4,
      time: Math.floor(new Date(time).getTime() / 1000),
    }),
  );
}
