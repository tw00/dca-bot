import Bot from "./bot";
import Order, { OrderSide, OrderType } from "../lib/order";
import { TickInfo } from "../lib/exchange";
import configs, { ConfigPreset } from "./dca-config";

export interface IDCABotConfig {
  symbol?: "ETH" | "BTC" | "REN" | string;
  baseOrder: number;
  safetyOrder: number;
  takeProfit: number;
  maxCount: number;
  safetyOrderDeviation: number;
  safetyOrderVolumeScale: number;
  safetyOrderDeviationScale: number;
}

export interface IDCAStep {
  // The order number, 0 is the base order
  orderNo: number;

  // Safety order deviation in percent
  // Price deviation to open safety orders (% from initial order)
  safetyOrderDeviation: number;

  // Current order volume
  orderAmountBase: number;

  // Respective quote size
  orderSizeQuote: number;

  // Total amount spend with fees (Total Volume)
  amountSpendBase: number;

  // Total amount spend including fees (Maximum Drawdown)
  // = amountSpendBase + fee
  maxDrawdownBase: number;

  // Volume/Size bought in the quote currency
  volumeBoughtQuote: number;

  // Price at which order is triggered (= nextThresholdBase)
  price: number;

  // Average entry price (= amount spend / volume bought)
  averageEntryPrice: number;

  // Required price to make 1%/TP% profit including fees
  // TODO: Rename to profitTargetQuote / profitTargetPrice
  // profitTargetQuote
  profitTargetBase: number; // = requiredPrice

  // Total fees (without selling fee)
  buyFeeBase: number;
}

const range = (from, to) =>
  [...Array(to - from + 1).keys()].map((v) => v + from);

export default class DCABot implements Bot {
  config: IDCABotConfig;
  tab: IDCAStep[];
  active: number;
  completedDeals: number;
  fee: number;

  constructor(preset: ConfigPreset, options: Partial<IDCABotConfig> = {}) {
    this.config = { ...configs[preset], ...options };
    this.completedDeals = 0;
    this.fee = 0.5; // TODO: Move to config?
    this.reset();
  }

  reset() {
    this.active = 0;
  }

  calcFeeFactor() {
    const feeFactor =
      (1 + this.fee / 100 + this.config.takeProfit / 100) /
      (1 - this.fee / 100);
    return feeFactor;
  }

  crunch(entryPrice: number): IDCAStep[] {
    const steps: IDCAStep[] = [];
    let safetyOrderDeviation = 0;
    let safetyOrderAmountBase = this.config.safetyOrder;
    let amountSpendBase = this.config.baseOrder;
    let orderSizeQuote = this.config.baseOrder / entryPrice;
    let volumeBoughtQuote = orderSizeQuote;
    let averageEntryPrice = entryPrice;
    let profitTargetBase = this.calcFeeFactor() * entryPrice;
    // let profitTargetBase = averageEntryPrice * (1 + this.config.takeProfit / 100);
    let buyFeeBase = this.config.baseOrder * (this.fee / 100);
    let maxDrawdownBase = amountSpendBase + buyFeeBase;

    steps.push({
      orderNo: 0,
      orderAmountBase: this.config.baseOrder,
      orderSizeQuote,
      safetyOrderDeviation,
      amountSpendBase,
      volumeBoughtQuote,
      maxDrawdownBase,
      price: entryPrice,
      averageEntryPrice,
      profitTargetBase,
      buyFeeBase,
    });

    let price;
    for (const orderNo of range(1, this.config.maxCount)) {
      safetyOrderDeviation +=
        this.config.safetyOrderDeviation +
        safetyOrderDeviation * (this.config.safetyOrderDeviationScale - 1);

      safetyOrderAmountBase =
        safetyOrderAmountBase *
        (orderNo > 1 ? this.config.safetyOrderVolumeScale : 1);
      price = entryPrice * (1 - safetyOrderDeviation / 100);
      orderSizeQuote = safetyOrderAmountBase / price;

      amountSpendBase += safetyOrderAmountBase;
      volumeBoughtQuote += safetyOrderAmountBase / price;
      averageEntryPrice = amountSpendBase / volumeBoughtQuote;

      buyFeeBase += safetyOrderAmountBase * (this.fee / 100);
      maxDrawdownBase = amountSpendBase + buyFeeBase;

      // const feeRate = buyFeeBase / amountSpendBase + 1;
      // const feeRate = 1 + this.fee / 100;
      // profitTargetBase = feeRate * averageEntryPrice * (1 + this.config.takeProfit / 100);

      // TODO: 3commas does not show fee in table, but internally includes it
      //       according to docs. Need to check this from real transactions!!
      profitTargetBase =
        this.calcFeeFactor() * (amountSpendBase / volumeBoughtQuote);

      steps.push({
        orderNo,
        maxDrawdownBase,
        safetyOrderDeviation,
        orderAmountBase: safetyOrderAmountBase,
        orderSizeQuote,
        amountSpendBase,
        volumeBoughtQuote,
        price,
        averageEntryPrice,
        profitTargetBase,
        buyFeeBase,
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
      const safetyOrderAmountBase = step.orderAmountBase;

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
