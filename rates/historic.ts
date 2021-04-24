/*
 */
import DB, { DBType, CoinbaseHistoricalData } from "../lib/db";
import fetch from "node-fetch";

const {
  RateLimiterMemory,
  RateLimiterQueue,
} = require("rate-limiter-flexible");

const COINBASE_SANDBOX_URL = "https://api-public.sandbox.pro.coinbase.com";
const COINBASE_URL = "https://api.pro.coinbase.com";
const DRY = false;

const rateStart = +new Date();
const fetchCoinbase = async (path) => {
  console.log("REQ", path, (+new Date() - rateStart) / 1000);
  const response = await fetch(COINBASE_URL + path, {});
  const data = await response.json();
  return data;
};

// We throttle public endpoints by IP: 3 requests per second up to 6 requests
// per second in bursts. Some endpoints may have custom rate limits.
// At most 3 request every 1s:
const limiterFlexible = new RateLimiterMemory({
  points: 3,
  duration: 1,
});

const limiter = new RateLimiterQueue(limiterFlexible);

async function throttledFetch(url) {
  await limiter.removeTokens(1);
  return await fetchCoinbase(url);
}

const productId = "BTC-USD";
const feed = new DB<CoinbaseHistoricalData>(productId, DBType.HISTORIC);
// const startDate = new Date().setHours(0, 0, 0, 0);
const startDate = new Date("2021-04-01T04:00:00.000Z");

let current = +startDate;
let dryReqCount = 0;
while (current < +new Date()) {
  // The granularity field must be one of the following values:
  // {60, 300, 900, 3600, 21600, 86400}.
  const granularity = 60;
  const maxCandles = 300;
  const dt = maxCandles * granularity;
  // const start = +startDate + idx * dt;
  current += dt * 1000;

  // start: 	    Start time in ISO 8601
  // end: 	      End time in ISO 8601
  // granularity: Desired timeslice in seconds
  const params = {
    start: new Date(current).toISOString(),
    end: new Date(current + dt * 1000).toISOString(),
    granularity: granularity,
  };

  if (DRY) {
    console.log(JSON.stringify(params));
    dryReqCount += 1;
    continue;
  }

  const queryParams = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  throttledFetch(`/products/${productId}/candles?${queryParams}`).then(
    (result) => {
      // - time: bucket start time
      // - low: lowest price during the bucket interval
      // - high: highest price during the bucket interval
      // - open: opening price (first trade) in the bucket interval
      // - close: closing price (last trade) in the bucket interval
      // - volume: volume of trading activity during the bucket interval
      result.forEach((candle) => {
        feed.append({
          type: "candle",
          time: candle[0],
          low: candle[1],
          high: candle[2],
          open: candle[3],
          close: candle[4],
          volume: candle[5],
        });
      });
    }
  );
}

if (DRY) {
  console.log("Dry run. Request #", dryReqCount);
}
