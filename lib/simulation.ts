import Exchange, { TickInfo } from "./exchange";
import DB, { DBType, ITickerData, IHistoricalData } from "./db";
import Bot from "../bots/bot";
import { guessPrice } from "./utils";

export interface ISimulationOptions {
  from?: Date;
  to?: Date;
  type?: DBType;
  symbol: string;
  fee: number;
  verbose?: boolean;
}

const dbMemoized = {};
function getDb({ symbol, type }: ISimulationOptions): DB<ITickerData> {
  const key = `${symbol}--${type}`;
  if (key in dbMemoized) {
    return dbMemoized[key];
  } else {
    const db = new DB<ITickerData>(`${symbol}-USD`, type);
    dbMemoized[key] = db;
    return db;
  }
}

export default class Simulation {
  exchange: Exchange;
  bots: Bot[];
  options: ISimulationOptions;

  constructor(options: ISimulationOptions) {
    this.exchange = new Exchange({ fee: options.fee });
    this.bots = [];
    this.options = {
      type: DBType.TICK,
      symbol: "ETH",
      verbose: false,
      ...options,
    };
  }

  addBot(bot: Bot): void {
    this.bots.push(bot.withFee(this.options.fee));
  }

  async init(initialCapital: number = 1000): Promise<void> {
    this.exchange.portfolio.updatePosition({
      amount: initialCapital,
      symbol: "USD",
    });
  }

  async run(): Promise<void> {
    return new Promise((resolve) => {
      const db = getDb(this.options);

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

  tick(data: ITickerData | IHistoricalData): void {
    const tick: TickInfo =
      this.options.type === DBType.TICK
        ? {
            price: Number((data as ITickerData).price),
            time: +new Date((data as ITickerData).time),
            symbol: this.options.symbol,
          }
        : {
            price: guessPrice(data as IHistoricalData),
            time: (data as IHistoricalData).time,
            symbol: this.options.symbol,
          };

    for (const bot of this.bots) {
      const orders = bot.decide(tick);

      if (orders) {
        if (this.options.verbose) console.log("Bot created order", orders);
        orders.forEach((order) => this.exchange.addOrder(order));
      }
    }

    if (this.options.verbose) console.log("tick:", tick);
    this.exchange.feed(tick);
  }

  print(): void {
    console.log("=".repeat(40));
    console.log(" ".repeat(16) + "SIMULATION");
    console.log("From:  ", this.options.from);
    console.log("To:    ", this.options.to);
    console.log("Symbol:", this.options.symbol);
    console.log("Fee:   ", this.options.fee, "%");
    console.log("Type:  ", this.options.type);
    console.log("=".repeat(40));
  }
}
