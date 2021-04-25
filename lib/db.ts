import { default as levelup, LevelUp } from "levelup";
import { default as leveldown } from "leveldown";

export interface ITimeIndexableData {
  type: string;
  key?: number;
  time: number;
}

export interface ITickerData extends ITimeIndexableData {
  type: "ticker";
  price: number;
  open_24h: number;
  volume_24h: number;
  low_24h: number;
  high_24h: number;
  volume_30d: number;
  best_bid: number;
  best_ask: number;
  side: string;
}

export interface IHistoricalData extends ITimeIndexableData {
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
type EndCallback = () => void;

interface IReadOptions {
  from?: number;
  to?: number;
}

interface IStreamOptions {
  gte?: number;
  lte?: number;
}

export default class DB<T extends IHistoricalData | ITickerData> {
  db: LevelUp;
  type: DBType;

  constructor(name: string, type: DBType) {
    const db = levelup(leveldown(`./db/${name}-${type}`));
    this.db = db;
    this.type = type;
  }

  append(data: T): void {
    const key = +new Date(data.time);
    const value = JSON.stringify(data);
    this.db.put(key, value);
  }

  delete(key: number): void {
    this.db.del(key);
  }

  _streamOptions({ from, to }: IReadOptions): IStreamOptions {
    const options = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
    return options;
  }

  readStream(
    dataCb: DataCallback<T>,
    endCb: EndCallback,
    readOptions: IReadOptions = {}
  ): void {
    const options = this._streamOptions(readOptions);

    this.db
      .createReadStream(options)
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

  read(readOptions: IReadOptions = {}): Promise<T[]> {
    const result = [];
    const options = this._streamOptions(readOptions);

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
