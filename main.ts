import DCABot from "./bots/dca";
import Simulation from "./lib/simulation";

(async () => {
  const sim = new Simulation({ symbol: "BTC" });
  sim.addBot(new DCABot({ symbol: "BTC" }));
  console.log(sim);

  await sim.init();
  await sim.run();

  sim.exchange.portfolio.print();
})();
