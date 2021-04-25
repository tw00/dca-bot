import Order, { OrderSide, OrderType } from "./order";
import Portfolio from "./portfolio";
import { getDiscountedFee } from "../lib/fee";

export interface TickInfo {
  symbol: string;
  time: number;
  price: number;
}

export interface IExchangeOptions {
  fee?: number;
  volumeLast30Days?: number;
}

export default class Exchange {
  orderbook: Order[];
  executedOrder: Order[];
  lastTick: TickInfo | null;
  portfolio: Portfolio;

  constructor({ volumeLast30Days, fee }: IExchangeOptions) {
    this.orderbook = [];
    this.executedOrder = [];
    this.lastTick = null;
    this.portfolio = new Portfolio({
      fee: volumeLast30Days ? getDiscountedFee(volumeLast30Days).makerFee : fee,
    });
  }

  addOrder(order) {
    this.orderbook.push(order);
  }

  clearOrder(order) {
    this.executedOrder.push(order);
    this.orderbook = this.orderbook.filter((o) => o !== order);
  }

  closePosition(symbol) {
    if (symbol == this.lastTick.symbol) {
      const amount = -this.portfolio.getFunds(symbol);
      this.portfolio.transaction(symbol, "USD", this.lastTick.price, amount, {
        includeFee: false,
      });
      // TODO: use market order?
    }
  }

  feed(data: TickInfo): void {
    // TODO: Slipage

    this.lastTick = data;

    this.orderbook.forEach((order) => {
      const transactQuote = (amount: number) => {
        this.portfolio.transaction(order.symbol, "USD", data.price, amount, {
          includeFee: true,
          time: new Date(data.time * 1000),
        });
        this.clearOrder(order);
      };

      if (order.sellAll) {
        order.amount = this.portfolio.getFunds(order.symbol);
      }

      if (order.symbol !== data.symbol) {
        return;
      }

      if (order.type === OrderType.MARKET) {
        if (order.side === OrderSide.BUY) {
          transactQuote(order.amount);
        }
        if (order.side === OrderSide.SELL) {
          transactQuote(-order.amount);
        }
      }

      if (order.type === OrderType.STOP) {
        if (order.side === OrderSide.BUY) {
          if (order.price >= data.price) {
            transactQuote(order.amount);
          }
        }

        if (order.side === OrderSide.SELL) {
          if (order.price <= data.price) {
            transactQuote(-order.amount);
          }
        }
      }
    });
  }
}
