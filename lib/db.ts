import { default as levelup, LevelUp } from "levelup";
import { default as leveldown } from "leveldown";

export interface TimeIndexableData {
  type: string;
  key?: number;
  time: number;
}

export interface CoinbaseTickerData extends TimeIndexableData {
  type: "ticker";
  sequence: number;
  product_id: string;
  price: string; // TODO: convert to number
  open_24h: string;
  volume_24h: string;
  low_24h: string;
  high_24h: string;
  volume_30d: string;
  best_bid: string;
  best_ask: string;
  side: string;
  // time: Date; // TODO !!
  trade_id: number;
  last_size: string;
}

export interface CoinbaseHistoricalData extends TimeIndexableData {
  type: "candle";
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

export enum DBType {
  HISTORIC = "historic",
  TICK = "tick",
}

type DataCallback<T> = (data: T) => void;

export default class DB<T extends CoinbaseHistoricalData | CoinbaseTickerData> {
  db: LevelUp;
  type: DBType;

  constructor(name, type: DBType) {
    const db = levelup(leveldown(`./db/${name}-${type}`));
    this.db = db;
    this.type = type;
  }

  append(data: T) {
    const key = +new Date(data.time);
    const value = JSON.stringify(data);
    this.db.put(key, value);
  }

  delete(key: number) {
    this.db.del(key);
  }

  readStream(dataCb: DataCallback<T>, endCb) {
    this.db
      .createReadStream()
      .on("data", (raw) => {
        const data = JSON.parse(raw.value.toString()) as T;
        data.key = raw.key.toString();
        dataCb(data);
      })
      .on("error", (err) => {
        throw err;
      })
      .on("end", () => {
        endCb();
      });
  }

  read(from: number = null, to: number = null): Promise<T[]> {
    const result = [];
    const options = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };

    return new Promise((resolve, reject) => {
      this.db
        .createReadStream(options)
        .on("data", (raw) => {
          const data = JSON.parse(raw.value.toString()) as T;
          data.key = raw.key.toString();
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
