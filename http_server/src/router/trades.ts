import { Router } from "express";
import { usermiddleware } from "../middleware";
import { CLOSEDORDERS, ORDERS } from "../data";

export const tradesRouter = Router();

tradesRouter.get("/open", usermiddleware, (req, res) => {
  //@ts-ignore
  const userid = req.userId;
  if (!ORDERS[userid]) {
    return res.status(200).json({
      trades: [],
    });
  }

  const formattedTrades = Object.entries(ORDERS[userid]).map(
    ([orderId, order]) => ({
      orderId,
      type: order.type,
      margin: order.margin,
      leverage: order.leverage,
      asset: order.asset,
      openPrice: order.openPrice,
      takeProfit: order.takeProfit,
      stopLoss: order.stopLoss,
      liquidationPrice: order.liquidationPrice,
    }),
  );

  return res.status(200).json({
    trades: formattedTrades,
  });
});

tradesRouter.get("/", usermiddleware, (req, res) => {
  //@ts-ignore
  const userid = req.userId!;

  if (!CLOSEDORDERS[userid]) {
    return res.status(200).json({
      trades: [],
    });
  }

  const formattedtrades = Object.entries(CLOSEDORDERS[userid] ?? {}).map(
    ([orderId, order]) => ({
      orderId,
      type: order.type,
      margin: order.margin,
      leverage: order.leverage,
      openPrice: order.openPrice,
      closePrice: order.closePrice,
      pnl: order.pnl,
    }),
  );

  return res.status(200).json({
    trades: formattedtrades,
  });
});

tradesRouter.post("/orders", (req, res) => {
  const query = req.query;
});
