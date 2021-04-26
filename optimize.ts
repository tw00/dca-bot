import DCABot, { IDCABotConfig } from "./bots/dca";
import Simulation from "./lib/simulation";
import { DBType } from "./lib/db";

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export async function fitness(options: IDCABotConfig): Promise<number> {
  const optionsSanatized = {
    baseOrder: Math.max(0, options.baseOrder),
    safetyOrder: Math.max(0, options.safetyOrder),
    takeProfit: Math.max(0, options.takeProfit),
    maxCount: Math.max(0, Math.round(options.maxCount)),
    safetyOrderDeviation: Math.max(0, options.safetyOrderDeviation),
    safetyOrderVolumeScale: Math.max(0, options.safetyOrderVolumeScale),
    safetyOrderDeviationScale: Math.max(0, options.safetyOrderDeviationScale),
  };

  const sim = new Simulation({
    from: new Date("2021-04-01T06:00:00-0400"),
    to: new Date("2021-04-17T23:05:00-0400"),
    symbol: "REN",
    type: DBType.HISTORIC,
    fee: 0.5,
  });

  const bot = new DCABot("Thomas", {
    symbol: sim.options.symbol,
    ...optionsSanatized,
  });
  sim.addBot(bot);

  await sim.init(10000);
  await sim.run();

  return bot.profit / bot.maxDrawdown;
}

export async function optimize(): Promise<IDCABotConfig> {
  const varParams: IDCABotConfig = {
    baseOrder: 20 / 10,
    safetyOrder: 40 / 10,
    takeProfit: 1 / 20,
    maxCount: 6 / 1,
    safetyOrderDeviation: 2.5 / 10,
    safetyOrderVolumeScale: 0.2 / 10,
    safetyOrderDeviationScale: 0.06 / 10,
  };
  let goodParams: IDCABotConfig = {
    baseOrder: 20,
    safetyOrder: 40,
    takeProfit: 1,
    maxCount: 6,
    safetyOrderDeviation: 2.5,
    safetyOrderVolumeScale: 1.2,
    safetyOrderDeviationScale: 1.06,
  };
  const currentParams = { ...goodParams };

  let profit_good = 0;
  const log = [];

  for (let n = 0; n < 1000; n++) {
    Object.keys(currentParams).forEach((key) => {
      currentParams[key] = goodParams[key] + varParams[key] * randn();
    });

    // calculate objective function
    const profit = await fitness(currentParams);

    // if profit is higher than any previous profit,
    // update h and r to new value
    if (profit > profit_good) {
      console.log(`[${n}]`, currentParams, "📈", profit);
      goodParams = { ...currentParams };
      profit_good = profit;
    } else {
      process.stdout.write("🔍");
    }

    // save results for visualization
    log.push([n, currentParams]);
  }

  return goodParams;
}

(async () => {
  const final = await optimize();
  console.log("final", final);
})();
