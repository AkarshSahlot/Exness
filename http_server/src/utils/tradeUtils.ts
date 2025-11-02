import { CLOSEDORDERS, ORDERS, PRICESTORE, USERS } from "../data";
import { calculatePnlCents } from "./utils";

export function closeOrder(
  userid: string,
  orderid: string,
  reason: "manual" | "take_profit" | "stop_loss" | "liquidation",
) {
  const order = ORDERS[userid]![orderid];
  if (!order) return;
  const user = USERS[userid];
  if (!user) return;
  const price = PRICESTORE[order.asset];
  const closeprice = order.type === "buy" ? price?.bid : price?.ask;
  if (!closeprice) return;
  const pnl = calculatePnlCents({
    side: order.type,
    openPrice: order.openPrice,
    closePrice: closeprice,
    marginCents: order.margin,
    leverage: order.leverage,
  });

  user.balance.usd_balance += order.margin + pnl;
  if (!CLOSEDORDERS[userid]) {
    CLOSEDORDERS[userid] = {};
  }
  CLOSEDORDERS[userid][orderid] = {
    ...order,
    closePrice: closeprice,
    pnl: pnl,
    closeTimestamp: Date.now(),
    closeReason: reason,
  };
  console.log(
    `Order ${orderid} for user ${userid} closed due to ${reason}. PnL: ${pnl}`,
  );
  delete ORDERS[userid]![orderid];
  return pnl;
}
