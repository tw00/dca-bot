import { plot, Plot } from "nodeplotlib";
import DB, { DBType, ITickerData, IHistoricalData } from "../lib/DB";

type PlotType = Plot["type"];

async function plotHistoric(pair) {
  const db = new DB<IHistoricalData>(pair, DBType.HISTORIC);
  const data = await db.read();
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
  const db = new DB<ITickerData>(pair, DBType.TICK);
  const data = await db.read();
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
  const type = process.argv.pop();
  const pair = process.argv.pop();
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
