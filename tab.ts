import DCABot from "./bots/dca";

(async () => {
  const price = Number(process.argv.pop());
  const bot = new DCABot("Thomas", { symbol: "REN" }).withFee(0.5);
  const tab = bot.crunch(price);
  console.log(tab);
})();
