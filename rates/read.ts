import DB, { CoinbaseTickerData, DBType } from "../lib/DB";

(async () => {
  const pair = process.argv.pop();
  if (!pair.match(/[A-Z]{3,}\-[A-Z]{3,}/)) {
    console.log("Invalid pair:", pair);
    process.exit(1);
  }
  const db = new DB<CoinbaseTickerData>(pair, DBType.TICK);
  const data = await db.read();
  console.log(data.map((x) => [x.time, x.price]));
})();
