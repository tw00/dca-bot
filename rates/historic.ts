/*
 */
import fetch from "node-fetch";
import { RateLimiterMemory, RateLimiterQueue } from "rate-limiter-flexible";
import DB, { DBType, IHistoricalData } from "../lib/db";

const COINBASE_SANDBOX_URL = "https://api-public.sandbox.pro.coinbase.com";
const COINBASE_PROD_URL = "https://api.pro.coinbase.com";

// const startDate = new Date().setHours(0, 0, 0, 0);
const startDateString = process.argv.pop();
const startDate = new Date(startDateString);
const productId = process.argv.pop();
const dryRun = process.argv.includes("--dry");
const coinbasUrl = process.argv.includes("--sandbox")
  ? COINBASE_SANDBOX_URL
  : COINBASE_PROD_URL;

if (!productId.match(/[A-Z]{3,}-[A-Z]{3,}/)) {
  console.log("Invalid productId:", productId);
  process.exit(1);
}

const rateStart = +new Date();
const fetchCoinbase = async (path) => {
  console.log("REQ", path, (+new Date() - rateStart) / 1000);
  const response = await fetch(coinbasUrl + path, {});
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

const feed = new DB<IHistoricalData>(productId, DBType.HISTORIC);

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

  if (dryRun) {
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
      if (!Array.isArray(result)) {
        console.warn("Result is not an array", result);
        return;
      }
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

if (dryRun) {
  console.log("Dry run. Request #", dryReqCount);
}
