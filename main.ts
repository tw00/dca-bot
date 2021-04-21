import DCABot from "./bots/dca";
import Simulation from "./lib/simulation";
import Order, { OrderSide } from "./lib/order";

(async () => {
  const sim = new Simulation();
  sim.addBot(new DCABot());
  const testorder1 = new Order(OrderSide.BUY, "BTC", 56205, 0.01);
  const testorder2 = new Order(OrderSide.SELL, "BTC", 56202, 0.005);
  sim.exchange.addOrder(testorder1);
  sim.exchange.addOrder(testorder2);
  console.log("sim.exchange", sim.exchange);
  await sim.init();
  await sim.run();
  console.log("DONE");

  sim.exchange.portfolio.print();
})();
