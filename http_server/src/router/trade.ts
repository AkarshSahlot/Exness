import { Router } from "express";
import { usermiddleware } from "../middleware";
import { CLOSEDORDERS, ORDERS, PRICESTORE, USERS } from "../data";
import { tradeSchema } from "../types/userschema";
import { v4 } from "uuid";
import { USD_SCALE, calculatePnlCents } from "../utils/utils";
import { closeOrder } from "../utils/tradeUtils";

export const tradeRouter = Router();

tradeRouter.post("/", usermiddleware, async (req, res) => {
  try {
    const tradeschema = tradeSchema.safeParse(req.body);
    if (!tradeschema.success) {
      return res.status(411).json({ message: "Incorrect inputs" });
    }
    let { asset, type, margin, leverage, takeProfit, stopLoss } =
      tradeschema.data;

    //@ts-ignore
    const userid = req.userId;
    const user = USERS[userid];

    if (!user) {
      return res.status(411).json({ message: "User not found" });
    }

    if (asset && asset.endsWith("USDT")) {
      asset = asset.replace("USDT", "") as any;
    }

    const basePriceData = PRICESTORE[asset];
    const openPrice = type === "buy" ? basePriceData?.ask : basePriceData?.bid;

    if (!openPrice || user.balance.usd_balance < margin) {
      return res
        .status(411)
        .json({ message: "Invalid asset or insufficient funds" });
    }

    user.balance.usd_balance -= margin;

    const orderid = v4();

    // Compute liquidation price: when unrealized PnL <= -margin
    // PnL = ((close - open) / open) * (margin * leverage)
    // Set liquidation where PnL = -margin -> ((close - open)/open) * leverage = -1
    // => close = open * (1 - 1/leverage) for long; for short, close = open * (1 + 1/leverage)
    // Formula for long: close = open * (1 - 1 / leverage)
    // This calculates the price at which the loss equals 100% of the margin.
    const liquidationPrice =
      type === "buy"
        ? Math.floor((openPrice as number) * (1 - 1 / leverage))
        : // Formula for short: close = open * (1 + 1 / leverage)
          Math.floor((openPrice as number) * (1 + 1 / leverage));

    const order = {
      type,
      margin,
      leverage,
      asset,
      openPrice: openPrice as number,
      timestamp: Date.now(),
      takeProfit: takeProfit ? Math.round(takeProfit * 10000) : undefined,
      stopLoss: stopLoss ? Math.round(stopLoss * 10000) : undefined,
      liquidationPrice,
    };

    if (!ORDERS[userid]) {
      ORDERS[userid] = {};
    }
    ORDERS[userid][orderid] = order;

    return res.status(200).json({ orderId: orderid });
  } catch (e) {
    console.log("error while trade", e);
    return res
      .status(500)
      .json({ message: "Server error during trade creation" });
  }
});

tradeRouter.post("/close", usermiddleware, (req, res) => {
  try {
    const { orderid } = req.body;
    //@ts-ignore
    const userid = req.userId;
    if (!ORDERS[userid] || !ORDERS[userid][orderid]) {
      return res.status(404).json({ message: "Order not found" });
    }

    const pnl = closeOrder(userid, orderid, "manual");

    return res.status(200).json({
      message: "Position closed successfully",
      pnl: pnl,
    });
  } catch (e) {
    console.log("Err", e);
    return res.status(500).json({ message: "Something went wrong" });
  }
});
