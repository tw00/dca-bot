import CoinbaseClient from "../lib/coinbase";
import DB, { CoinbaseTickerData, DBType } from "../lib/DB";

(async () => {
  const pair = "BTC-USD";
  // const pair = "ETH-USD";
  const feed = new DB<CoinbaseTickerData>(pair, DBType.TICK);
  const client = await new CoinbaseClient();
  client.subscribe(pair, (data) => {
    process.stdout.write(".");
    if (Math.random() < 0.001) {
      console.log(data);
    }
    feed.append(data);
  });
})();
