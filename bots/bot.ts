import Order from "../lib/order";
import { TickInfo } from "../lib/exchange";

export default interface Bot {
  withFee(number): Bot;
  decide(tick: TickInfo): null | Order[];
}
