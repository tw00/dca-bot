import Exchange, { TickInfo } from "./exchange";
import DB, { CoinbaseTickerData, DBType } from "./db";
import Bot from "../bots/bot";

export default class Simulation {
  exchange: Exchange;
  bots: Bot[];
  options: {
    symbol: string;
  };

  constructor(options = {}) {
    this.exchange = new Exchange();
    this.bots = [];
    this.options = {
      symbol: "ETH",
      ...options,
    };
  }

  addBot(bot: Bot) {
    this.bots.push(bot);
  }

  async init() {
    this.exchange.portfolio.addPosition({
      amount: 1000,
      symbol: "USD",
      price: 1,
    });
  }

  async run(): Promise<void> {
    return new Promise((resolve) => {
      const db = new DB<CoinbaseTickerData>(
        `${this.options.symbol}-USD`,
        DBType.TICK
      );

      db.readStream(this.tick.bind(this), () => {
        this.exchange.closePosition(this.options.symbol);
        resolve();
      });
    });
  }

  tick(data: CoinbaseTickerData) {
    const tick: TickInfo = {
      price: Number(data.price),
      time: +new Date(data.time),
      symbol: this.options.symbol,
    };

    for (const bot of this.bots) {
      const orders = bot.decide(tick);

      if (orders) {
        console.log("Bot created orders", orders);
        orders.forEach((order) => this.exchange.addOrder(order));
      }
    }

    console.log("tick:", tick);
    this.exchange.feed(tick);
  }
}
