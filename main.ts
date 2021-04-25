import DCABot from "./bots/dca";
import Simulation from "./lib/simulation";
import { DBType } from "./lib/db";

(async () => {
  const sim = new Simulation({
    from: new Date("2021-04-17 16:38:12"),
    // to: new Date("2021-04-17 16:48:12"),
    to: new Date("2021-04-18 16:48:12"),
    symbol: "REN",
    type: DBType.HISTORIC,
    fee: 0.5,
  });

  const bot = new DCABot("Thomas", { symbol: sim.options.symbol });
  sim.addBot(bot);

  await sim.init(10000);
  await sim.run();

  sim.exchange.portfolio.print();
  console.log();
  bot.print();
})();
