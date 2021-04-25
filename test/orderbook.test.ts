/* eslint-disable @typescript-eslint/no-empty-function */
import Simulation from "../lib/simulation";
import Order from "../lib/order";

describe("orderbook", () => {
  it("should work", async () => {
    const sim = new Simulation({ symbol: "BTC", fee: 0 });

    const testorder1 = Order.Buy(0.01, "BTC").atStopPrice(56205);
    const testorder2 = Order.Sell(0.05, "BTC").atStopPrice(56202);

    sim.exchange.addOrder(testorder1);
    sim.exchange.addOrder(testorder2);

    const backupConsoleLog = console.log;
    console.log = () => {};
    console.warn = jest.fn(() => {});

    await sim.init();
    await sim.run();

    expect(console.warn).toHaveBeenCalled();

    const res = [];
    console.log = (...args) =>
      res.push(args.map((x) => JSON.stringify(x, null, 2)).join(" "));
    sim.exchange.portfolio.print();
    console.log = backupConsoleLog;
    expect(res).toMatchSnapshot();
  });
});
