import { plot, Plot } from "nodeplotlib";
import DB, { DBType, ITickerData, IHistoricalData } from "../lib/DB";
// import { guessPrice } from "../lib/utils";

type PlotType = Plot["type"];

function toLocale(ts, doIt) {
  const date = new Date(1000 * ts);
  return doIt ? date.toLocaleString() : date.toISOString();
}

function fakeLocalTimezone(ts, doIt) {
  const minToMs = (min) => min * 60 * 1000;
  const timezoneOffset = doIt ? minToMs(new Date().getTimezoneOffset()) : 0;
  return new Date(1000 * ts - timezoneOffset);
}

const tradingExitPrices = [
  // Trade 1:
  [new Date("2021-04-18T15:31:37Z"), 1.0236048],
  [new Date("2021-04-18T15:32:41Z"), 1.00178145],
  [new Date("2021-04-18T16:23:53Z"), 0.9703917],
  // Trade 5:
  // [new Date("2021-04-19T01:05:29Z"), 0.9731819],
  // [new Date("2021-04-19T07:37:58Z"), 0.9757728],
  //
  // [new Date("2021-04-20T17:51:36Z"), 0.88698465],
  // [new Date("2021-04-20T20:36:17Z"), 0.900647],
  // [new Date("2021-04-21T01:59:08Z"), 0.89775135],
  // [new Date("2021-04-21T03:03:40Z"), 0.91053215],
  // [new Date("2021-04-21T04:54:37Z"), 0.9078362],
  // [new Date("2021-04-21T08:35:42Z"), 0.90633845],
  // [new Date("2021-04-21T12:49:02Z"), 0.89036245],
  // [new Date("2021-04-21T14:31:56Z"), 0.8880659],
  // [new Date("2021-04-21T15:44:37Z"), 0.89974835],
  // [new Date("2021-04-21T19:21:48Z"), 0.89815075],
  // [new Date("2021-04-22T10:19:12Z"), 0.8670974],
  // [new Date("2021-04-22T11:07:58Z"), 0.87937895],
  // [new Date("2021-04-22T11:46:57Z"), 0.8932581],
  // [new Date("2021-04-22T13:06:51Z"), 0.8968527],
  // [new Date("2021-04-22T14:40:56Z"), 0.8948557],
  // [new Date("2021-04-22T16:32:23Z"), 0.90713725],
  // [new Date("2021-04-22T23:09:50Z"), 0.8405373],
  // [new Date("2021-04-23T00:16:25Z"), 0.8249607],
  // [new Date("2021-04-23T23:03:45Z"), 0.79710255],
  // [new Date("2021-04-24T00:23:26Z"), 0.8088903],
  // [new Date("2021-04-24T03:00:24Z"), 0.7937055],
  // [new Date("2021-04-24T03:03:10Z"), 0.806193],
  // [new Date("2021-04-24T04:13:19Z"), 0.8043948],
  // [new Date("2021-04-24T05:49:58Z"), 0.8143848],
  // [new Date("2021-04-24T08:22:27Z"), 0.8132859],
  // [new Date("2021-04-24T21:52:15Z"), 0.7856136],
  // [new Date("2021-04-24T22:50:30Z"), 0.783216],
  // [new Date("2021-04-25T10:14:01Z"), 0.7687305],
  // [new Date("2021-04-25T12:11:53Z"), 0.7784208],
  // [new Date("2021-04-25T14:28:39Z"), 0.7899093],
  // [new Date("2021-04-25T16:49:33Z"), 0.8010981],
];

// const botTransactions = [];

async function plotHistoric(pair) {
  const db = new DB<IHistoricalData>(pair, DBType.HISTORIC);
  const data = await db.read({
    // Trade 1:
    // from: +new Date("2021-04-17T12:37:00-0400"),
    // to: +new Date("2021-04-18T11:45:00-0400"),
    // Trade 5:
    // from: +new Date("2021-04-18T21:05:00-0400"),
    // to: +new Date("2021-04-19T03:39:00-0400"),
    // Optimization:
    from: +new Date("2021-04-01T06:00:00-0400"),
    to: +new Date("2021-04-17T23:05:00-0400"),
  });
  const plotData: Plot[] = [
    {
      name: "LOW",
      x: data.map((x) => fakeLocalTimezone(x.time, true)),
      y: data.map((x) => x.low),
      type: "line" as PlotType,
    },
    {
      name: "HIGH",
      x: data.map((x) => fakeLocalTimezone(x.time, true)),
      y: data.map((x) => x.high),
      type: "line" as PlotType,
    },
    {
      name: "EXIT DEALS",
      x: tradingExitPrices.map((d) => fakeLocalTimezone(+d[0] / 1000, true)),
      y: tradingExitPrices.map((d) => d[1]),
      type: "scatter" as PlotType,
    },
  ];
  console.log("Start:", toLocale(data[0].time, true));
  console.log("End:  ", toLocale(data[data.length - 1].time, true));
  plot(plotData);
}

async function plotTicker(pair) {
  const db = new DB<ITickerData>(pair, DBType.TICK);
  const data = await db.read();
  const start = +new Date(data[0].time);
  const plotData: Plot[] = [
    {
      x: data.map((x) => (+new Date(x.time * 1000) - start) / 1000.0),
      y: data.map((x) => Number(x.price)),
      type: "line" as PlotType,
    },
  ];
  console.log("plotData", plotData);
  plot(plotData);
}

(async () => {
  const pair = process.argv.pop();
  const type = process.argv.pop();
  if (!(Object.values(DBType) as string[]).includes(type)) {
    console.log("Invalid type:", type);
    process.exit(1);
  }
  if (!pair.match(/[A-Z]{3,}-[A-Z]{3,}/)) {
    console.log("Invalid pair:", pair);
    process.exit(1);
  }
  if (type === DBType.HISTORIC) plotHistoric(pair);
  if (type === DBType.TICK) plotTicker(pair);
})();
