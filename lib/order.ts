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
    symbol: string,
    price: number,
    amount: number,
    type: OrderType = OrderType.STOP
  ) {
    this.side = side;
    this.symbol = symbol;
    this.price = price;
    this.amount = amount;
    this.type = type;
  }
}
