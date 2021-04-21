import { plot, Plot } from "nodeplotlib";
import DB from "./lib/DB";

type PlotType = Plot["type"];

(async () => {
  const db = new DB("BTC-USD");
  const data = await db.read(null, null);
  const start = +new Date(data[0].time);
  const plotData: Plot[] = [
    {
      x: data.map((x) => (+new Date(x.time) - start) / 1000.0),
      y: data.map((x) => Number(x.price)),
      type: "line" as PlotType,
      // text: "FOOBAR",
      // title: { text: "XXXX" },
      // xaxis: "X",
      // yaxis: "foobar",
    },
  ];

  console.log("plotData", plotData);

  plot(plotData);
})();
