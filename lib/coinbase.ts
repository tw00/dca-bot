/* eslint-disable @typescript-eslint/ban-ts-comment */
import WebSocket from "ws";

export interface ICoinbaseTickerData {
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
  time: string;
  trade_id: number;
  last_size: string;
}

type SubscriptionCallback = (data: ICoinbaseTickerData) => void;

export default class CoinbaseWebsocketClient {
  ws: WebSocket;
  subscriber: {
    [key: string]: SubscriptionCallback;
  };

  // @ts-ignore
  constructor(): Promise<CoinbaseWebsocketClient> {
    const url = "wss://ws-feed.pro.coinbase.com";
    const ws = new WebSocket(url);

    this.ws = ws;
    this.subscriber = {};
    const ready = new Promise((resolve) => {
      ws.on("open", () => {
        resolve(this);
      });
    });

    ws.on("message", (data) => {
      this.onMessage(JSON.parse(data) as ICoinbaseTickerData);
    });

    // @ts-ignore
    return ready;
  }

  send(data: unknown): void {
    this.ws.send(JSON.stringify(data));
  }

  subscribe(ticker: string, callback: SubscriptionCallback): void {
    this.subscriber[ticker] = callback;
    this.send({
      type: "subscribe",
      product_ids: [ticker],
      channels: [
        // "level2",
        // "heartbeat",
        {
          name: "ticker",
          product_ids: [ticker],
        },
      ],
    });
  }

  onMessage(data: ICoinbaseTickerData): void {
    const cb = this.subscriber[data.product_id];
    if (cb) {
      cb(data);
    }
  }
}
