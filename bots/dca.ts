import Bot from "./bot";

// import Order, { OrderSide } from "./lib/order";
// new Order(OrderSide.BUY, "BTC", 56205, 10);

interface IDCABotConfig {
  baseOrder: number;
  safetyOrder: number;
}

export default class DCABot implements Bot {
  config: IDCABotConfig = {
    baseOrder: 20,
    safetyOrder: 40,
  };
  entry: number;

  constructor() {
    this.entry = 0;
  }

  decide() {
    // TODO
    return null;
  }
}
