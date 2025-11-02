import { ORDERS } from "../data";
import { closeOrder } from "../utils/tradeUtils";

export async function checkOpenPositions(
  asset: string,
  newPrice: { ask: number; bid: number },
) {
  for (const userid in ORDERS) {
    for (const orderid in ORDERS[userid]) {
      const order = ORDERS[userid][orderid];
      if (!order) continue;
      if (order.asset !== asset) continue;

      if (order.takeProfit) {
        if (order.type === "buy" && newPrice.bid >= order.takeProfit) {
          closeOrder(userid, orderid, "take_profit");
          continue;
        }
        if (order.type === "sell" && newPrice.ask <= order.takeProfit) {
          closeOrder(userid, orderid, "take_profit");
          continue;
        }
      }

      if (order.stopLoss) {
        if (order.type === "buy" && newPrice.bid <= order.stopLoss) {
          closeOrder(userid, orderid, "stop_loss");
          continue;
        }
        if (order.type === "sell" && newPrice.ask >= order.stopLoss) {
          closeOrder(userid, orderid, "stop_loss");
          continue;
        }
      }

      if (order.liquidationPrice) {
        if (order.type === "buy" && newPrice.bid <= order.liquidationPrice) {
          closeOrder(userid, orderid, "liquidation");
          continue;
        }
        if (order.type === "sell" && newPrice.ask >= order.liquidationPrice) {
          closeOrder(userid, orderid, "liquidation");
          continue;
        }
      }
    }
  }
}
