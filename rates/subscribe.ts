import CoinbaseClient from "../lib/coinbase";
import DB, { ITickerData, DBType } from "../lib/DB";

(async () => {
  const pair = process.argv.pop();
  if (!pair.match(/[A-Z]{3,}-[A-Z]{3,}/)) {
    console.log("Invalid pair:", pair);
    process.exit(1);
  }

  const feed = new DB<ITickerData>(pair, DBType.TICK);
  const client = await new CoinbaseClient();

  client.subscribe(pair, (data) => {
    process.stdout.write(".");
    if (Math.random() < 0.001) {
      console.log(data);
    }

    feed.append({
      type: "ticker",
      price: Number(data.price),
      open_24h: Number(data.open_24h),
      volume_24h: Number(data.volume_24h),
      low_24h: Number(data.low_24h),
      high_24h: Number(data.high_24h),
      volume_30d: Number(data.volume_30d),
      best_bid: Number(data.best_bid),
      best_ask: Number(data.best_ask),
      side: data.side,
      time: +new Date(data.time),
    });
  });
})();
