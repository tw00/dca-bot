import Bot from "./bot";
import Order, { OrderSide, OrderType } from "../lib/order";
import { TickInfo } from "../lib/exchange";

interface IDCABotConfig {
  symbol: "ETH" | "BTC";
  baseOrder: number;
  safetyOrder: number;
  takeProfit: number;
  maxCount: number;
  safetyOrderDeviation: number;
  safetyOrderVolumeScale: number;
  safetyOrderDeviationScale: number;
}

const defaultConfig: IDCABotConfig = {
  symbol: "ETH",
  baseOrder: 25,
  safetyOrder: 50,
  takeProfit: 1.5, // percent
  maxCount: 6,
  // safetyOrderDeviation: 2.0, // percent
  safetyOrderDeviation: 2.0 / 56000, // percent
  safetyOrderVolumeScale: 1.05,
  safetyOrderDeviationScale: 1,
};

export default class DCABot implements Bot {
  config: IDCABotConfig;
  // entry: number;
  active: number;
  amountSpend: number;
  amountBought: number;
  lastPrice: number;
  averagePrice: number;

  constructor(options = {}) {
    // this.entry = 0;
    this.config = { ...defaultConfig, ...options };
    this.reset();
  }

  reset() {
    this.active = 0;
    this.amountSpend = 0;
    this.averagePrice = 0;
  }

  decide(tick: TickInfo) {
    if (this.active === 0) {
      const amount = this.config.baseOrder / tick.price;
      this.active = 1;
      this.amountSpend = this.config.baseOrder;
      this.averagePrice = tick.price;
      this.amountBought = amount;
      this.lastPrice = tick.price;
      return [
        new Order(
          OrderSide.BUY,
          this.config.symbol,
          0,
          amount,
          OrderType.MARKET
        ),
      ];
      // TODO: Immediatley place sell order?
    }

    const profitTarget = this.averagePrice * (1 + this.config.takeProfit / 100);

    if (tick.price > profitTarget) {
      this.reset();
      return [
        new Order(
          OrderSide.SELL,
          this.config.symbol,
          0,
          this.amountBought,
          OrderType.MARKET
        ),
      ];
    }

    if (this.active > 0 && this.active < this.config.maxCount) {
      const safetyOrderDeviation =
        this.config.safetyOrderDeviation +
        this.config.safetyOrderDeviationScale * (this.active - 1);

      const nextThreshold = this.lastPrice * (1 - safetyOrderDeviation / 100);


      if (tick.price <= nextThreshold) {
        this.active += 1;
        this.lastPrice = tick.price;

        const safetyOrderAmount =
          this.config.safetyOrder *
          this.config.safetyOrderVolumeScale *
          (this.active - 1);

        const amount = safetyOrderAmount / tick.price;

        this.amountSpend += safetyOrderAmount;
        this.averagePrice = this.amountSpend / this.amountBought; // TODO
        this.amountBought += amount;

        return [
          new Order(
            OrderSide.BUY,
            this.config.symbol,
            0,
            amount,
            OrderType.MARKET
          ),
        ];
      }
    }

    return null;
  }
}
