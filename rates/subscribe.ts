import CoinbaseClient from "../lib/coinbase";
import DB, { CoinbaseTickerData, DBType } from "../lib/DB";

(async () => {
  const pair = process.argv.pop();
  if (!pair.match(/[A-Z]{3,}\-[A-Z]{3,}/)) {
    console.log("Invalid pair:", pair);
    process.exit(1);
  }
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
