## DCA Bot

### Gathering Historic Data

Uses Coinbase API to collect historic data (takes care of rate-limiting and
300 max candle limitation as well):

```bash
ts-node rates/historic.ts
```

### Gathering Ticker Data

Subscribe to Coinbase WebSocket and stream to DB:

```bash
ts-node rates/subscribe.ts
```

Read DB:

```bash
ts-node rates/read.ts
```

Plot result:

```bash
ts-node rates/plot.ts
```

### Simulation

Run Simulation:

```bash
ts-node main.ts
```

#### Example

```js
Simulation {
  exchange: Exchange {
    orderbook: [],
    lastTick: null,
    portfolio: Portfolio { positions: {}, transactions: [] }
  },
  bots: [
    DCABot {
      config: [Object],
      active: 0,
      amountSpend: 0,
      averagePrice: 0
    }
  ],
  options: { symbol: 'BTC' }
}
Bot created orders [
  Order {
    side: 'buy',
    symbol: 'BTC',
    price: 0,
    amount: 0.00044473753636396464,
    type: 'market'
  }
]
tick: { price: 56212.93, time: 1618972759428, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972759635, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972759729, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972759732, symbol: 'BTC' }
tick: { price: 56212.92, time: 1618972759942, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972760402, symbol: 'BTC' }
Bot created orders [
  Order {
    side: 'buy',
    symbol: 'BTC',
    price: 0,
    amount: 0.000934074947327069,
    type: 'market'
  }
]
tick: { price: 56205.34, time: 1618972760584, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972760662, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972761094, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972761512, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972762261, symbol: 'BTC' }
tick: { price: 56212.92, time: 1618972762865, symbol: 'BTC' }
tick: { price: 56212.62, time: 1618972763044, symbol: 'BTC' }
tick: { price: 56203.88, time: 1618972763147, symbol: 'BTC' }
tick: { price: 56206.72, time: 1618972763319, symbol: 'BTC' }
tick: { price: 56209.8, time: 1618972763469, symbol: 'BTC' }
tick: { price: 56209.8, time: 1618972763536, symbol: 'BTC' }
tick: { price: 56209.8, time: 1618972764086, symbol: 'BTC' }
tick: { price: 56209.8, time: 1618972764102, symbol: 'BTC' }
tick: { price: 56210.26, time: 1618972764637, symbol: 'BTC' }
tick: { price: 56210.26, time: 1618972764790, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972766161, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972766203, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972766592, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972767132, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972767529, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972767741, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972767986, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768072, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768092, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768099, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768108, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768120, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768128, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768136, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768152, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768183, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768285, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768454, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768661, symbol: 'BTC' }
tick: { price: 56212.92, time: 1618972768721, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972768731, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972769255, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972769777, symbol: 'BTC' }
tick: { price: 56212.92, time: 1618972769965, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972770018, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972770076, symbol: 'BTC' }
tick: { price: 56212.92, time: 1618972770133, symbol: 'BTC' }
tick: { price: 56212.93, time: 1618972770738, symbol: 'BTC' }
tick: { price: 56212.92, time: 1618972771256, symbol: 'BTC' }
tick: { price: 56204.58, time: 1618972771316, symbol: 'BTC' }
tick: { price: 56204.59, time: 1618972771347, symbol: 'BTC' }
tick: { price: 56204.61, time: 1618972771518, symbol: 'BTC' }
tick: { price: 56209.7, time: 1618972771838, symbol: 'BTC' }
tick: { price: 56204.66, time: 1618972772030, symbol: 'BTC' }
tick: { price: 56204.87, time: 1618972774027, symbol: 'BTC' }
tick: { price: 56202.01, time: 1618972774818, symbol: 'BTC' }
tick: { price: 56202.02, time: 1618972776458, symbol: 'BTC' }
tick: { price: 56202.02, time: 1618972776992, symbol: 'BTC' }
tick: { price: 56202.01, time: 1618972777019, symbol: 'BTC' }
tick: { price: 56202.02, time: 1618972777767, symbol: 'BTC' }
tick: { price: 56202.02, time: 1618972777993, symbol: 'BTC' }
tick: { price: 56202.02, time: 1618972778138, symbol: 'BTC' }
tick: { price: 56202.02, time: 1618972778260, symbol: 'BTC' }
tick: { price: 56202.02, time: 1618972778549, symbol: 'BTC' }
tick: { price: 56202.01, time: 1618972778588, symbol: 'BTC' }
========================================
Transactions: [
  { amount: 1000, symbol: 'USD', price: 1 },
  { amount: 0.00044473753636396464, symbol: 'BTC', price: 56212.93 },
  { amount: -25.0625, symbol: 'USD', price: 56212.93 },
  { amount: 0.000934074947327069, symbol: 'BTC', price: 56205.34 },
  { amount: -52.63125, symbol: 'USD', price: 56205.34 },
  { amount: -0.0013788124836910337, symbol: 'BTC', price: 56202.01 },
  { amount: 77.49203299652832, symbol: 'USD', price: 56202.01 }
]
Positions: { USD: 999.7982829965283, BTC: 0 }
========================================
```
