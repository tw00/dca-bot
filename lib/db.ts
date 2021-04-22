import { default as levelup } from "levelup";
import { default as leveldown } from "leveldown";

export interface CoinbaseTickerData {
  type: string;
  sequence: number;
  product_id: string;
  price: string;
  open_24h: string;
  volume_24h: string;
  low_24h: string;
  high_24h: string;
  volume_30d: string;
  best_bid: string;
  best_ask: string;
  side: string;
  time: Date;
  trade_id: number;
  last_size: string;
}

export default class DB {
  db: any;

  constructor(name) {
    const db = levelup(leveldown(`./db/${name}`));
    this.db = db;
  }

  readStream(dataCb, endCb) {
    this.db
      .createReadStream()
      .on("data", (raw) => {
        const data = JSON.parse(raw.value.toString());
        const key = raw.key.toString();
        dataCb(data);
      })
      .on("error", (err) => {
        throw err;
      })
      .on("end", () => {
        endCb();
      });
  }

  read(from: number, to: number): Promise<CoinbaseTickerData[]> {
    const result = [];
    const options = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };

    return new Promise((resolve, reject) => {
      this.db
        .createReadStream(options)
        .on("data", (raw) => {
          const data = JSON.parse(raw.value.toString());
          const key = raw.key.toString();
          result.push(data);
        })
        .on("error", (err) => {
          reject(err);
        })
        .on("end", () => {
          resolve(result);
        });
    });
  }
}
