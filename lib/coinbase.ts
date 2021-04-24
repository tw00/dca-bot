import WebSocket from "ws";

export default class CoinbaseWebsocketClient {
  ws: WebSocket;
  subscriber: { [key: string]: Function };

  // @ts-ignore
  constructor(): Promise<CoinbaseWebsocketClient> {
    const url = "wss://ws-feed.pro.coinbase.com";
    const ws = new WebSocket(url);

    this.ws = ws;
    this.subscriber = {};
    const ready = new Promise((resolve, reject) => {
      ws.on("open", () => {
        resolve(this);
      });
    });

    ws.on("message", (data) => {
      this.onMessage(JSON.parse(data));
    });

    // @ts-ignore
    return ready;
  }

  send(data) {
    this.ws.send(JSON.stringify(data));
  }

  subscribe(ticker, callback) {
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

  onMessage(data) {
    const cb = this.subscriber[data.product_id];
    if (cb) {
      cb(data);
    }
  }
}
