import { plot, Plot } from "nodeplotlib";
import DB, {
  DBType,
  CoinbaseHistoricalData,
  CoinbaseTickerData,
} from "../lib/DB";

type PlotType = Plot["type"];

async function plotHistoric(pair) {
  const db = new DB<CoinbaseHistoricalData>(pair, DBType.HISTORIC);
  const data = await db.read(null, null);
  const plotData: Plot[] = [
    {
      x: data.map((x) => x.time),
      // y: data.map((x) => x.low - x.high),
      y: data.map((x) => (x.low + x.high) / 2),
      type: "line" as PlotType,
    },
  ];

  console.log("Start:", new Date(1000 * data[0].time));
  console.log("End:  ", new Date(1000 * data[data.length - 1].time));
  plot(plotData);
}

async function plotTicker(pair) {
  const db = new DB<CoinbaseTickerData>(pair, DBType.TICK);
  const data = await db.read(null, null);
  const start = +new Date(data[0].time);
  const plotData: Plot[] = [
    {
      x: data.map((x) => (+new Date(x.time) - start) / 1000.0),
      y: data.map((x) => Number(x.price)),
      type: "line" as PlotType,
    },
  ];
  console.log("plotData", plotData);
  plot(plotData);
}

(async () => {
  // const pair = "ETH-USD"
  const pair = "BTC-USD";
  plotHistoric(pair);
  // plotTicker(pair);
})();
