import DCABot from "./bots/dca";
import Simulation from "./lib/simulation";

(async () => {
  const sim = new Simulation({ symbol: "BTC" });
  const bot = new DCABot("TradeAltCoins", { symbol: "BTC" });
  sim.addBot(bot);
  console.log(sim);

  await sim.init();
  await sim.run();

  console.log(bot);
  sim.exchange.portfolio.print();
})();
