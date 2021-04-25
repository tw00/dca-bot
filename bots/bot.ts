import Order from "../lib/order";

export default interface Bot {
  withFee(number): Bot;
  decide(data: any): null | Order[];
}
