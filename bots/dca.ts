import Bot from "./bot";
import Order from "../lib/order";
import { TickInfo } from "../lib/exchange";
import { range } from "../lib/utils";
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
  profitTargetPrice: number;

  // Total fees (without selling fee)
  buyFeeBase: number;
}

interface ISummaryReturnValue {
  maxBotUsageBase: number;
  maxDeviation: number;
}

export default class DCABot implements Bot {
  config: IDCABotConfig;
  tab: IDCAStep[];
  active: number;
  completedDeals: number;
  fee: number;
  profit: number;

  constructor(preset: ConfigPreset, options: Partial<IDCABotConfig> = {}) {
    this.config = { ...configs[preset], ...options };
    this.completedDeals = 0;
    this.fee = 0.5;
    this.profit = 0;
    this.restart();
  }

  withFee(fee: number): DCABot {
    this.fee = fee;
    return this;
  }

  restart(): void {
    this.active = 0;
  }

  calcFeeFactor(): number {
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
    let profitTargetPrice = this.calcFeeFactor() * entryPrice;
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
      profitTargetPrice,
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

      // TODO: 3commas does not show fee in table, but internally includes it
      //       according to docs. Need to check this from real transactions!!
      profitTargetPrice =
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
        profitTargetPrice,
        buyFeeBase,
      });
    }
    return steps;
  }

  summary(entryPrice: number): ISummaryReturnValue {
    const steps = this.crunch(entryPrice);

    // Max amount for bot usage (Based on current rate)
    const maxBotUsageBase = steps[steps.length - 1].maxDrawdownBase;

    // Max safe order price deviation
    const maxDeviation = steps[steps.length - 1].safetyOrderDeviation;

    return { maxBotUsageBase, maxDeviation };
  }

  decide(tick: TickInfo): Order[] {
    const orders = [];

    if (this.active === 0) {
      this.tab = this.crunch(tick.price);
      const baseOrderQuote = this.tab[0].orderSizeQuote;
      // TODO: Immediatley place sell order?
      // TODO: Place limit order instead
      orders.push(Order.Buy(baseOrderQuote, this.config.symbol).atMarketRate());
      this.active = 1;
      return orders;
    }

    const step = this.tab[this.active];
    const profitTargetPrice = step.profitTargetPrice;

    if (tick.price >= profitTargetPrice) {
      // TODO: volumeBoughtQuote is off by a tiny amount
      // orders.push(Order.Sell(step.volumeBoughtQuote, this.config.symbol).atMarketRate());
      orders.push(Order.SellAll(this.config.symbol).atMarketRate());
      this.completedDeals += 1;
      const sellFeeBase =
        (this.fee / 100) * tick.price * step.volumeBoughtQuote;
      const totalFees = step.buyFeeBase + sellFeeBase;
      this.profit += tick.price * step.volumeBoughtQuote - totalFees;
      this.restart();
      return orders;
    }

    if (this.active > 0 && this.active < this.config.maxCount) {
      const nextThresholdBase = step.price;
      // step.price is not the same as tick.price, but orderSizeQuote is based
      // on the step.price, so instead of using the pre-calculated
      // step.orderSizeQuote, we calculate the quote size with the new price:
      const safetyOrderAmountQuote = step.orderAmountBase / tick.price;

      if (tick.price <= nextThresholdBase) {
        orders.push(
          Order.Buy(safetyOrderAmountQuote, this.config.symbol).atMarketRate()
        );

        this.active += 1;
        return orders;
      }
    }

    return null;
  }

  print(): void {
    console.log("=".repeat(40));
    console.log("Total Profit:", this.profit);
    console.log("Completed Deals:", this.completedDeals);
    console.log("Fees:", this.fee);
    console.log("Current Step:", this.active);
    console.log("=".repeat(40));
  }
}
