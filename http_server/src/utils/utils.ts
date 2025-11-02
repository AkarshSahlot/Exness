import type { CookieOptions } from "express";

export const PRICE_SCALE = 10000;
export const USD_DECIMALS = 2;
export const USD_SCALE = 100;

export function toDisplayPrice(intPrice: number): number {
  return intPrice / PRICE_SCALE;
}

export function toInternalPrice(price: number): number {
  return Math.round(price * PRICE_SCALE);
}

export function toDisplayUSD(intUSD: number): number {
  return intUSD / USD_SCALE;
}

export function toInternalUSD(usd: number): number {
  return Math.round(usd * USD_SCALE);
}

// Calculate PnL using integer math to avoid precision loss
export function calculatePnlCents({
  side,
  openPrice,
  closePrice,
  marginCents,
  leverage,
}: {
  side: "buy" | "sell";
  openPrice: number; // PRICE_SCALE
  closePrice: number; // PRICE_SCALE
  marginCents: number; // USD_SCALE
  leverage: number;
}): number {
  const MONEY_SCALE = 100n;
  const PRICE_SCALE = 10000n;
  const CONVERSION_FACTOR = PRICE_SCALE / MONEY_SCALE; // 100n

  const openP = BigInt(openPrice);
  const closeP = BigInt(closePrice);
  const margin = BigInt(marginCents);
  const lev = BigInt(leverage);

  const marginOnPriceScale = margin * CONVERSION_FACTOR;
  const totalPositionValue = marginOnPriceScale * lev;

  let pnlOnPriceScale = ((closeP - openP) * totalPositionValue) / openP;
  if (side === "sell") {
    pnlOnPriceScale = -pnlOnPriceScale;
  }
  const finalPnl = pnlOnPriceScale / CONVERSION_FACTOR;
  return Number(finalPnl);
}

export function getCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";

  return {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? ".exness.elevenai.xyz" : undefined,
  };
}
