import Bot from "./bot";
import Order, { OrderSide, OrderType } from "../lib/order";
import { TickInfo } from "../lib/exchange";
import configs from "./dca-config";

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

type ConfigPreset = "TradeAltCoins" | "Vincent";

const range = (from, to) =>
  [...Array(to - from + 1).keys()].map((v) => v + from);

export default class DCABot implements Bot {
  config: IDCABotConfig;
  active: number;
  amountSpend: number;
  amountBought: number;
  lastPrice: number;
  averagePrice: number;

  constructor(preset: ConfigPreset, options: Partial<IDCABotConfig>) {
    this.config = { ...configs[preset], ...options };
    this.reset();
  }

  reset() {
    this.active = 0;
    this.amountSpend = 0;
    this.amountBought = 0;
    this.lastPrice = 0;
    this.averagePrice = 0;
  }

  crunch(entryPrice) {
    const steps = [];
    let safetyOrderDeviation = 0;
    let safetyOrderAmountBase = this.config.safetyOrder;
    let maxDrawdownBase = this.config.baseOrder;
    let amountSpendBase = this.config.baseOrder / entryPrice;
    let averagePrice = entryPrice;
    let profitTarget = averagePrice * (1 + this.config.takeProfit / 100);

    steps.push({
      orderNo: 0,
      safetyOrderDeviation,
      order: this.config.baseOrder,
      maxDrawdownBase,
      amountSpendBase,
      price: entryPrice,
      averagePrice,
      profitTarget,
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
      profitTarget = averagePrice * (1 + this.config.takeProfit / 100);

      steps.push({
        orderNo,
        safetyOrderDeviation,
        order: safetyOrderAmountBase,
        maxDrawdownBase, // = amountBoughtBase
        amountSpendBase,
        price,
        averagePrice,
        profitTarget, // = requiredPrice
      });
    }
    return steps;
  }

  summary(entryPrice) {
    const steps = this.crunch(entryPrice);

    // Max amount for bot usage (Based on current rate)
    const maxBotUsageBase = steps[steps.length - 1].maxDrawdownBase;

    // Max safe order price deviation
    const maxDeviation = steps[steps.length - 1].safetyOrderDeviation;

    return { maxBotUsageBase, maxDeviation };
  }

  decide(tick: TickInfo) {
    // TODO: Price is always Base/Quote

    if (this.active === 0) {
      const amount = this.config.baseOrder / tick.price;
      this.active = 1;
      this.amountSpend = this.config.baseOrder;
      this.averagePrice = tick.price;
      this.amountBought = amount;
      this.lastPrice = tick.price;
      // this.tab = this.crunch();
      return [
        new Order(OrderSide.BUY, OrderType.MARKET, this.config.symbol, amount),
      ];
      // TODO: Immediatley place sell order?
    }

    const profitTargetBase =
      this.averagePrice * (1 + this.config.takeProfit / 100);
    const profitTargetQuote = profitTargetBase / tick.price;

    console.log("profitTargetBase", {
      price: tick.price,
      profitTargetBase,
      profitTargetQuote,
    });

    if (tick.price > profitTargetBase) {
      this.reset();
      return [
        new Order(
          OrderSide.SELL,
          OrderType.MARKET,
          this.config.symbol,
          this.amountBought
        ),
      ];
    }

    if (this.active > 0 && this.active < this.config.maxCount) {
      const safetyOrderDeviation =
        this.config.safetyOrderDeviation +
        this.config.safetyOrderDeviationScale * (this.active - 1);

      const nextThresholdBase =
        this.lastPrice * (1 - safetyOrderDeviation / 100);
      const nextThresholdQuote = nextThresholdBase / tick.price;

      // TODO: Wrong currency - SO is in relation to base currency
      console.log("nextThreshold", {
        price: tick.price,
        nextThresholdBase,
        nextThresholdQuote,
      });

      if (tick.price <= nextThresholdBase) {
        this.active += 1;
        this.lastPrice = tick.price;

        const safetyOrderAmountBase =
          this.config.safetyOrder *
          this.config.safetyOrderVolumeScale *
          (this.active - 1);

        const safetyOrderAmountQuote = safetyOrderAmountBase / tick.price;

        console.log("safetyOrderAmount", {
          price: tick.price,
          safetyOrderAmountBase,
          safetyOrderAmountQuote,
        });

        this.amountSpend += safetyOrderAmountBase;
        this.averagePrice = this.amountSpend / this.amountBought; // TODO
        this.amountBought += safetyOrderAmountQuote;

        return [
          new Order(
            OrderSide.BUY,
            OrderType.MARKET,
            this.config.symbol,
            safetyOrderAmountQuote
          ),
        ];
      }
    }

    return null;
  }
}
