export interface PositionUpdate {
  symbol: string;
  amount: number;
  price: number;
  time?: Date;
}

export interface Transaction extends PositionUpdate {
  balance?: number;
}

interface PositionMap {
  [key: string]: number;
}

export default class Portfolio {
  positions: PositionMap;
  transactions: Transaction[];

  constructor() {
    this.positions = {};
    this.transactions = [];
  }

  addPosition(position: PositionUpdate): void {
    // console.log("New position", position);

    if (!(position.symbol in this.positions)) {
      this.positions[position.symbol] = 0;
    }
    this.positions[position.symbol] += position.amount;
    this.transactions.push({
      ...position,
      balance: this.getFunds(position.symbol),
    });
  }

  getFunds(symbol) {
    return this.positions[symbol] || 0;
  }

  print() {
    console.log("=".repeat(40));
    console.log("Transactions:", this.transactions);
    console.log("Positions:", this.positions);
    console.log("=".repeat(40));
  }
}
