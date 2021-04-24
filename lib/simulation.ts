import Exchange, { TickInfo } from "./exchange";
import DB, { CoinbaseTickerData, DBType } from "./db";
import Bot from "../bots/bot";
import { guessPrice } from "./utils";

interface ISimulationOptions {
  from?: Date;
  to?: Date;
  symbol: string;
  type: DBType;
}

const SHOW_TICKS = false;

export default class Simulation {
  exchange: Exchange;
  bots: Bot[];
  options: ISimulationOptions;

  constructor(options: Partial<ISimulationOptions> = {}) {
    this.exchange = new Exchange();
    this.bots = [];
    this.options = {
      type: DBType.TICK,
      symbol: "ETH",
      ...options,
    };
  }

  addBot(bot: Bot) {
    this.bots.push(bot);
  }

  async init(initialCapital: number = 1000) {
    this.exchange.portfolio.addPosition({
      amount: initialCapital,
      symbol: "USD",
      price: 1,
    });
  }

  async run(): Promise<void> {
    return new Promise((resolve) => {
      const db = new DB<CoinbaseTickerData>(
        `${this.options.symbol}-USD`,
        this.options.type
      );

      const streamOptions = {
        from: +this.options.from,
        to: +this.options.to,
      };

      db.readStream(
        this.tick.bind(this),
        () => {
          this.exchange.closePosition(this.options.symbol);
          resolve();
        },
        streamOptions
      );
    });
  }

  tick(data: CoinbaseTickerData) {
    const tick: TickInfo =
      this.options.type === DBType.TICK
        ? {
            price: Number(data.price),
            time: +new Date(data.time),
            symbol: this.options.symbol,
          }
        : {
            price: guessPrice(data),
            time: data.time,
            symbol: this.options.symbol,
          };

    for (const bot of this.bots) {
      const orders = bot.decide(tick);

      if (orders) {
        console.log("Bot created order", orders);
        orders.forEach((order) => this.exchange.addOrder(order));
      }
    }

    if (SHOW_TICKS) console.log("tick:", tick);
    this.exchange.feed(tick);
  }
}
