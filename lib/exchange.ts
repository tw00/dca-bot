import Order, { OrderSide, OrderType } from "./order";
import Portfolio, { PositionUpdate } from "./portfolio";

export interface TickInfo {
  symbol: string;
  time: number;
  price: number;
}

export default class Exchange {
  orderbook: Order[];
  lastTick: TickInfo | null;
  portfolio: Portfolio;

  constructor() {
    this.orderbook = [];
    this.lastTick = null;
    this.portfolio = new Portfolio();
  }

  addOrder(order) {
    this.orderbook.push(order);
  }

  clearOrder(order) {
    this.orderbook = this.orderbook.filter((o) => o !== order);
  }

  calculateFee(price) {
    return (0.25 / 100) * price;
  }

  closePosition(symbol) {
    if (symbol == this.lastTick.symbol) {
      const amount = -this.portfolio.getFunds(symbol);
      this.transaction(symbol, "USD", this.lastTick.price, amount, false);
      // TODO: use market order?
    }
  }

  transaction(from, to, price, amount, includeFee = true) {
    // TODO: Test

    const priceWithFee = price + (includeFee ? this.calculateFee(price) : 0);
    const amount1 = amount;
    const amount2 = -priceWithFee * amount;

    // check funds
    if (
      this.portfolio.getFunds(from) + amount1 < 0 ||
      this.portfolio.getFunds(to) + amount2 < 0
    ) {
      console.warn("Insufficient funds: Order rejected.");
      return;
    }

    this.portfolio.addPosition({
      amount: amount1,
      symbol: from,
      price,
    });

    this.portfolio.addPosition({
      amount: amount2,
      symbol: to,
      price,
    });
  }

  feed(data: TickInfo): void {
    // TODO: Slipage

    this.lastTick = data;

    this.orderbook.forEach((order) => {
      const transaction = (amount: number) => {
        const updates = this.transaction(
          order.symbol,
          "USD",
          data.price,
          amount
        );
        this.clearOrder(order);
      };

      if (order.symbol !== data.symbol) {
        return;
      }

      if (order.type === OrderType.MARKET) {
        if (order.side === OrderSide.BUY) {
          transaction(order.amount);
        }
        if (order.side === OrderSide.SELL) {
          transaction(-order.amount);
        }
      }

      if (order.type === OrderType.STOP) {
        if (order.side === OrderSide.BUY) {
          if (order.price >= data.price) {
            transaction(order.amount);
          }
        }

        if (order.side === OrderSide.SELL) {
          if (order.price <= data.price) {
            transaction(-order.amount);
          }
        }
      }
    });
  }
}
