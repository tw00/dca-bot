export interface IPositionUpdate {
  symbol: string;
  amount: number;
}

export interface ITransaction {
  transfer: string;
  price: number;
  amountFrom: number;
  amountTo: number;
  time: Date;
  balanceTo: number;
  balanceFrom: number;
  fee: number;
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
    to: string,
    from: string, // = USD
    price: number,
    amount: number,
    options: ITransactionOptions = {}
  ): void {
    const { includeFee = true, time = null } = options;

    const priceWithFee = price + (includeFee ? this.calculateFee(price) : 0);
    const amountTo = amount;
    const amountFrom = -priceWithFee * amount;

    // check funds
    if (
      this.getFunds(to) + amountTo < 0 ||
      this.getFunds(from) + amountFrom < 0
    ) {
      // TODO: Also include failed transactions
      console.warn("Insufficient funds: Order rejected.\n", {
        time,
        from,
        to,
        price,
        amount,
        balanceFrom: this.getFunds(from),
        balanceTo: this.getFunds(to),
        balanceFromNew: this.getFunds(from) + amountFrom,
        balanceToNew: this.getFunds(to) + amountTo,
      });
      return;
    }

    this.updatePosition({ amount: amountTo, symbol: to });
    this.updatePosition({ amount: amountFrom, symbol: from });

    this.transactions.push({
      transfer:
        `${from}${amount > 0 ? "->" : "<-"}${to}` +
        ` (${amount > 0 ? "buying" : "selling"} ${to})`,
      price,
      amountTo,
      amountFrom,
      balanceTo: this.getFunds(to),
      balanceFrom: this.getFunds(from),
      fee: Math.abs(amount) * this.calculateFee(price),
      time: time && new Date(time).toLocaleString(),
      // value: portfolio value
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
    console.log(" ".repeat(16) + "PORTFOLIO");
    console.log("Transactions:", this.transactions);
    console.log();
    console.log("Positions:", JSON.stringify(this.positions, null, 2));
    console.log("=".repeat(40));
  }
}
