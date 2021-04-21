import Order from "../lib/order";

export default interface Bot {
  decide(data: any): null | Order[];
}
