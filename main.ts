import DCABot from "./bots/dca";
import Simulation from "./lib/simulation";
import { DBType } from "./lib/db";

(async () => {
  const sim = new Simulation({
    // Trade 1:
    // from: new Date("2021-04-17T12:37:00-0400"),
    // to: new Date("2021-04-18T11:45:00-0400"),

    // Trade 5:
    // from: new Date("2021-04-18T21:04:00-0400"),
    // to: new Date("2021-04-19T03:40:00-0400"),

    symbol: "REN",
    type: DBType.HISTORIC,
    fee: 0.5,
  });

  const bot = new DCABot("Thomas", { symbol: sim.options.symbol });
  sim.addBot(bot);

  await sim.init(10000);
  await sim.run();

  sim.print();
  console.log();
  sim.exchange.portfolio.print();
  console.log();
  bot.print();
})();
