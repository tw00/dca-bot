import Bot from "./bot";
import Order, { OrderSide, OrderType } from "../lib/order";
import { TickInfo } from "../lib/exchange";
import configs, { ConfigPreset } from "./dca-config";

export interface IDCABotConfig {
  symbol: "ETH" | "BTC";
  baseOrder: number;
  safetyOrder: number;
  takeProfit: number;
  maxCount: number;
  safetyOrderDeviation: number;
  safetyOrderVolumeScale: number;
  safetyOrderDeviationScale: number;
}

export interface IDCAStep {
  orderNo: number;
  safetyOrderDeviation: number;
  order: number;
  maxDrawdownBase: number;
  amountSpendBase: number;
  price: number;
  averagePrice: number;
  profitTargetBase: number;

  // amountSpend
  // averagePrice
  // amountBought
  // lastPrice
  // profitTargetBase
  // profitTargetQuote
  // safetyOrderDeviation
  // nextThresholdBase
  // nextThresholdQuote
  // safetyOrderAmountBase
  // safetyOrderAmountQuote
}

const range = (from, to) =>
  [...Array(to - from + 1).keys()].map((v) => v + from);

export default class DCABot implements Bot {
  config: IDCABotConfig;
  tab: IDCAStep[];
  active: number;
  completedDeals: number;

  constructor(preset: ConfigPreset, options: Partial<IDCABotConfig>) {
    this.config = { ...configs[preset], ...options };
    this.completedDeals = 0;
    this.reset();
  }

  reset() {
    this.active = 0;
  }

  crunch(entryPrice: number): IDCAStep[] {
    const steps: IDCAStep[] = [];
    let safetyOrderDeviation = 0;
    let safetyOrderAmountBase = this.config.safetyOrder;
    let maxDrawdownBase = this.config.baseOrder;
    let amountSpendBase = this.config.baseOrder / entryPrice;
    let averagePrice = entryPrice;
    let profitTargetBase = averagePrice * (1 + this.config.takeProfit / 100);

    steps.push({
      orderNo: 0,
      safetyOrderDeviation,
      order: this.config.baseOrder,
      maxDrawdownBase,
      amountSpendBase,
      price: entryPrice,
      averagePrice,
      profitTargetBase,
    });

    let price, fee;
    for (const orderNo of range(1, this.config.maxCount)) {
      safetyOrderDeviation +=
        this.config.safetyOrderDeviation +
        safetyOrderDeviation * (this.config.safetyOrderDeviationScale - 1);

      // TODO: Add fee
      fee = 0;
      safetyOrderAmountBase =
        safetyOrderAmountBase *
          (orderNo > 1 ? this.config.safetyOrderVolumeScale : 1) +
        fee;
      price = entryPrice * (1 - safetyOrderDeviation / 100);

      maxDrawdownBase += safetyOrderAmountBase;
      amountSpendBase += safetyOrderAmountBase / price;
      averagePrice = maxDrawdownBase / amountSpendBase;
      profitTargetBase = averagePrice * (1 + this.config.takeProfit / 100);

      steps.push({
        orderNo,
        safetyOrderDeviation,
        order: safetyOrderAmountBase,
        maxDrawdownBase, // = amountBoughtBase
        amountSpendBase,
        price,
        averagePrice,
        profitTargetBase, // = requiredPrice
      });
    }
    return steps;
  }

  summary(entryPrice: number) {
    const steps = this.crunch(entryPrice);

    // Max amount for bot usage (Based on current rate)
    const maxBotUsageBase = steps[steps.length - 1].maxDrawdownBase;

    // Max safe order price deviation
    const maxDeviation = steps[steps.length - 1].safetyOrderDeviation;

    return { maxBotUsageBase, maxDeviation };
  }

  decide(tick: TickInfo): Order[] {
    if (this.active === 0) {
      const baseOrderQuote = this.config.baseOrder / tick.price;
      this.active = 1;
      this.tab = this.crunch(tick.price);
      return [Order.Buy(baseOrderQuote, this.config.symbol).atMarketRate()];
      // TODO: Immediatley place sell order?
    }

    const step = this.tab[this.active];
    const profitTargetBase = step.profitTargetBase;
    const amountBoughtBase = step.maxDrawdownBase - step.order;

    if (tick.price > profitTargetBase) {
      this.reset();
      this.completedDeals += 1;
      return [
        // amountBoughtQuote
        // amountBoughtBase / tick.price
        Order.SellAll(this.config.symbol).atMarketRate(),
      ];
    }

    if (this.active > 0 && this.active < this.config.maxCount) {
      const nextThresholdBase = step.price;
      const safetyOrderAmountBase = step.order;

      if (tick.price <= nextThresholdBase) {
        this.active += 1;

        return [
          Order.Buy(
            safetyOrderAmountBase / tick.price,
            this.config.symbol
          ).atMarketRate(),
        ];
      }
    }

    return null;
  }
}
