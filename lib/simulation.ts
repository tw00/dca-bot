import Exchange, { TickInfo } from "./exchange";
import DB, { CoinbaseTickerData } from "./db";
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
      symbol: "BTC",
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
      const db = new DB(`${this.options.symbol}-USD`);

      db.readStream(this.tick.bind(this), () => {
        this.exchange.closePosition(this.options.symbol);
        resolve();
      });
    });
  }

  tick(data: CoinbaseTickerData) {
    for (const bot of this.bots) {
      const orders = bot.decide(data);
      if (orders) {
        orders.forEach((order) => this.exchange.addOrder(order));
      }
    }

    const tick: TickInfo = {
      price: Number(data.price),
      time: +new Date(data.time),
      symbol: this.options.symbol,
    };

    console.log("tick:", tick);
    this.exchange.feed(tick);
  }
}
