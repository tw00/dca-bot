import Simulation from "../lib/simulation";
import Order, { OrderSide, OrderType } from "../lib/order";

describe("orderbook", () => {
  it.skip("should work", async () => {
    const sim = new Simulation({ symbol: "BTC" });

    const testorder1 = new Order(
      OrderSide.BUY,
      OrderType.STOP,
      "BTC",
      0.01,
      56205
    );
    const testorder2 = new Order(
      OrderSide.SELL,
      OrderType.STOP,
      "BTC",
      0.005,
      56202
    );

    sim.exchange.addOrder(testorder1);
    sim.exchange.addOrder(testorder2);

    await sim.init();
    await sim.run();

    sim.exchange.portfolio.print();
  });
});
