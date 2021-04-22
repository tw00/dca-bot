export enum OrderType {
  STOP = "stop",
  MARKET = "market",
  // TRAILING_STOP,
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

  constructor(
    side: OrderSide,
    type: OrderType = OrderType.STOP,
    symbol: string,
    amount: number,
    price: number = 0
  ) {
    this.side = side;
    this.symbol = symbol;
    this.price = price;
    this.amount = amount;
    this.type = type;
  }
}
