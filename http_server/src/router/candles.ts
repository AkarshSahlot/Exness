import { Router } from "express";
import { pgClient } from "..";

export const candelrouter = Router();

candelrouter.get("/", async (req, res) => {
  console.log(" i am here ");
  const duration = req.query.ts;
  const asset = req.query.asset;
  const startTime = req.query.startTime;
  const endTime = req.query.endTime;

  let dbtable;
  switch (duration) {
    case "1m":
      dbtable = "candles_1m";
      break;
    case "1w":
      dbtable = "candles_1w";
      break;
    case "1d":
      dbtable = "candles_1d";
      break;
    default:
      return res.status(400).json({ message: "Invalid time duration" });
  }

  let symbol;
  switch (asset) {
    case "BTC":
      symbol = "BTCUSDT";
      break;
    case "ETH":
      symbol = "ETHUSDT";
      break;
    case "SOL":
      symbol = "SOLUSDT";
      break;
    default:
      return res.status(400).json({ message: "Invalid asset" });
  }

  console.log(dbtable, symbol, startTime, endTime);

  const query = `SELECT * FROM ${dbtable} WHERE symbol = $1 AND bucket >= $2 AND bucket <= $3 ORDER BY bucket ASC`;

  console.log(query);
  try {
    const data = await pgClient.query(query, [
      symbol,
      new Date(Number(startTime) * 1000),
      new Date(Number(endTime) * 1000),
    ]);

    const candles = data.rows.map((row) => ({
      timestamp: Math.floor(new Date(row.bucket).getTime() / 1000),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      decimal: 4,
    }));

    res.status(200).json({ candles });
  } catch (err) {
    console.log(
      "errror from the endpoint api/v1/trading/candles/candlesId :",
      err,
    );
    res.json({
      msg: "Invalid arguement",
    });
  }
});
