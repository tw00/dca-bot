/*
Examples:
  Order.Buy(10, "BTC").atMarketRate();
  Order.Sell(10, "USD").atStopPrice(50000);
  Order.SellAll("USD").atStopPrice(50000);
*/

export enum OrderType {
  STOP = "stop",
  MARKET = "market",
  // TRAILING_STOP = "trailing_stop",
}

export enum OrderSide {
  BUY = "buy",
  SELL = "sell",
}

export default class Order {
  side: OrderSide;
  type: OrderType;
  symbol: string;
  price: number;
  amount: number;
  sellAll: boolean;

  static Buy(amount, symbol) {
    return new Order(OrderSide.BUY, OrderType.MARKET, symbol, amount);
  }

  static SellAll(symbol) {
    return new Order(OrderSide.SELL, OrderType.MARKET, symbol, 0, 0, true);
  }

  static Sell(amount, symbol) {
    return new Order(OrderSide.SELL, OrderType.MARKET, symbol, amount);
  }

  constructor(
    side: OrderSide,
    type: OrderType = OrderType.STOP,
    symbol: string,
    amount: number,
    price: number = 0,
    sellAll: boolean = false
  ) {
    this.side = side;
    this.symbol = symbol;
    this.price = price;
    this.amount = amount;
    this.type = type;
    this.sellAll = sellAll;
  }

  atMarketRate() {
    this.type = OrderType.MARKET;
    return this;
  }

  atStopPrice(price) {
    this.type = OrderType.STOP;
    this.price = price;
    return this;
  }
}
