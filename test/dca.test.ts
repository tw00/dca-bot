import DCABot from "../bots/dca";
import { OrderSide, OrderType } from "../lib/order";

const roundBy = (num, digits) =>
  Math.round(num * 10 ** digits + Number.EPSILON) / 10 ** digits;

describe("DCA Bot", () => {
  let bot;
  const price = 1000.0;
  let spend = 0;
  let bought = 0;

  beforeAll(() => {
    bot = new DCABot("Test", { symbol: "BTC" });
    bot.fee = 0;
  });

  it("initialize correctly", async () => {
    expect(bot.active).toBe(0);
  });

  it("crunch correctly", () => {
    const steps = bot.crunch(1.1998);
    expect(steps).toMatchSnapshot();

    const { maxBotUsageBase, maxDeviation } = bot.summary(1.1998);
    expect(roundBy(maxBotUsageBase, 2)).toBe(365.1);
    expect(roundBy(maxDeviation, 2)).toBe(12.3);
  });

  it("make base order ASAP", async () => {
    const [order] = bot.decide({ symbol: "BTC", time: 0, price });
    expect(bot.active).toBe(1);
    expect(order.side).toBe(OrderSide.BUY);
    expect(order.type).toBe(OrderType.MARKET);
    expect(order.amount).toBe(0.025);
    spend += order.amount * price;
    bought += order.amount;
  });

  it("not buy", async () => {
    bot.decide({ symbol: "BTC", time: 1, price: price - 10 });
    expect(bot.active).toBe(1);
  });

  it("buy once below threshold", async () => {
    const t =
      price * (1 - bot.config.safetyOrderDeviation / 100) - Number.EPSILON;
    const [order] = bot.decide({ symbol: "BTC", time: 2, price: t });
    expect(bot.active).toBe(2);
    expect(order.side).toBe(OrderSide.BUY);
    expect(order.amount * t).toBe(bot.config.safetyOrder);
    spend += order.amount * t;
    bought += order.amount;
  });

  it("buy once below 2nd threshold", async () => {
    const t = price - 45;
    const [order] = bot.decide({ symbol: "BTC", time: 3, price: t });
    expect(bot.active).toBe(3);
    expect(order.side).toBe(OrderSide.BUY);
    expect(order.amount * t).toBe(50 * 1.05);
    spend += order.amount * t;
    bought += order.amount;
  });

  it("sell when taking 1% profit", async () => {
    const t = price - 45 + 25;
    expect(bot.active).toBe(3);
    const [order] = bot.decide({ symbol: "BTC", time: 4, price: t });
    expect(order.side).toBe(OrderSide.SELL);
    expect(order.sellAll).toBe(true);
    const gainPercent = ((bought * price) / spend - 1) * 100;
    console.log("gainPercent", gainPercent);
    expect(gainPercent).toBeGreaterThan(bot.config.takeProfit);
    expect(bot.active).toBe(0);
  });
});
