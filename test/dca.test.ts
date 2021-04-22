import DCABot from "../bots/dca";
import { OrderSide, OrderType } from "../lib/order";

const roundBy = (num, digits) =>
  Math.round(num * 10 ** digits + Number.EPSILON) / 10 ** digits;

describe("DCA Bot", () => {
  let bot;

  beforeAll(() => {
    bot = new DCABot("TradeAltCoins", { symbol: "BTC" });
  });

  it("initialize correctly", async () => {
    expect(bot.active).toBe(0);
    expect(bot.amountBought).toBe(0);
    expect(bot.amountSpend).toBe(0);
    expect(bot.lastPrice).toBe(0);
    expect(bot.averagePrice).toBe(0);
  });

  it("make base order ASAP", async () => {
    const price = 1000.0;
    const [order] = bot.decide({ symbol: "BTC", time: 0, price });
    expect(bot.active).toBe(1);
    expect(bot.amountSpend).toBe(bot.config.baseOrder);
    expect(bot.amountBought).toBe(bot.config.baseOrder / price);
    expect(bot.averagePrice).toBe(price);
    expect(order.side).toBe(OrderSide.BUY);
    expect(order.type).toBe(OrderType.MARKET);
    expect(order.amount).toBe(0.025);
  });

  it.skip("not buy", async () => {
    bot.decide({ symbol: "BTC", time: 1, price: 1000.0 - 10 });
    expect(bot.active).toBe(1);
  });

  it("buy", async () => {
    const [order] = bot.decide({ symbol: "BTC", time: 2, price: 1000.0 - 25 });
    console.log("order", order);
    // bot.decide({ symbol: "BTC", time: 2, price: 100.0 });
  });

  it("crunch", () => {
    const steps = bot.crunch(1.1998);
    expect(steps).toMatchSnapshot();

    const { maxBotUsageBase, maxDeviation } = bot.summary(1.1998);
    expect(roundBy(maxBotUsageBase, 2)).toBe(365.1);
    expect(roundBy(maxDeviation, 2)).toBe(12.3);
  });
});
