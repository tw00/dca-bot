const WebSocket = require("ws");
const levelup = require("levelup");
const leveldown = require("leveldown");

class CoinbaseClient {
  constructor() {
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

class Feed {
  constructor(name) {
    const db = levelup(leveldown(`./db/${name}`));
    this.db = db;
  }

  append(data) {
    const key = +new Date(data.time);
    const value = JSON.stringify(data);
    this.db.put(key, value);
  }
}

(async () => {
  const market = "BTC-USD";
  // const market = "ETH-USD";
  const feed = new Feed(market);
  const client = await new CoinbaseClient();
  client.subscribe(market, (data) => {
    process.stdout.write(".");
    if (Math.random() < 0.001) {
      console.log(data);
    }
    feed.append(data);
  });
})();
