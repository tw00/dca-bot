export interface IPositionUpdate {
  symbol: string;
  amount: number;
  price: number;
  time?: Date;
}

export interface ITransaction {
  from: string;
  to: string;
  price: number;
  amount: number;
  time: Date;
  balance?: number;
}

export interface ITransactionOptions {
  includeFee?: boolean;
  time?: Date;
}

export interface IPortfolioOptions {
  fee: number;
}

interface IPositionMap {
  [key: string]: number;
}

export default class Portfolio {
  positions: IPositionMap;
  transactions: ITransaction[];
  fee: number;

  constructor({ fee }: IPortfolioOptions) {
    this.positions = {};
    this.transactions = [];
    this.fee = fee;
  }

  calculateFee(price: number): number {
    return (this.fee / 100) * price;
  }

  // amount is in from currency
  transaction(
    from: string,
    to: string,
    price: number,
    amount: number,
    options: ITransactionOptions = {}
  ): void {
    const { includeFee = true, time = null } = options;

    const priceWithFee = price + (includeFee ? this.calculateFee(price) : 0);
    const amount1 = amount;
    const amount2 = -priceWithFee * amount;

    // check funds
    if (this.getFunds(from) + amount1 < 0 || this.getFunds(to) + amount2 < 0) {
      // TODO: Also include failed transactions
      console.warn("Insufficient funds: Order rejected.\n", {
        time,
        from,
        to,
        price,
        amount,
        balanceFrom: this.getFunds(from),
        balanceTo: this.getFunds(to),
        balanceFromNew: this.getFunds(from) + amount1,
        balanceToNew: this.getFunds(to) + amount2,
      });
      return;
    }

    this.updatePosition({
      amount: amount1,
      symbol: from,
      price,
      time,
    });

    this.updatePosition({
      amount: amount2,
      symbol: to,
      price,
      time,
    });
  }

  updatePosition(position: IPositionUpdate): void {
    if (!(position.symbol in this.positions)) {
      this.positions[position.symbol] = 0;
    }
    this.positions[position.symbol] += position.amount;
  }

  getFunds(symbol: string): number {
    return this.positions[symbol] || 0;
  }

  print(): void {
    console.log("=".repeat(40));
    console.log("Transactions:", this.transactions);
    console.log("Positions:", this.positions);
    console.log("=".repeat(40));
  }
}
