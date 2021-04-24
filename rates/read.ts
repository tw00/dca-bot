import DB, { CoinbaseTickerData, DBType } from "../lib/DB";

(async () => {
  // const pair = "ETH-USD"
  const pair = "BTC-USD";
  const db = new DB<CoinbaseTickerData>(pair, DBType.TICK);
  const foobar = await db.read(null, null);
  console.log(foobar.map((x) => [x.time, x.price]));
})();
