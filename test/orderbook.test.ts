import Simulation from "../lib/simulation";
import Order, { OrderSide } from "../lib/order";

describe("orderbook", () => {
  it('should work', () => {
    const sim = new Simulation();

    const testorder1 = new Order(OrderSide.BUY, "BTC", 56205, 0.01);
    const testorder2 = new Order(OrderSide.SELL, "BTC", 56202, 0.005);

    sim.exchange.addOrder(testorder1);
    sim.exchange.addOrder(testorder2);

    await sim.init();
    await sim.run();

    sim.exchange.portfolio.print();
  })
};
