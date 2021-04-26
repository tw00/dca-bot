/* eslint-disable @typescript-eslint/no-unused-vars */
import { fitness } from "./optimize";

// -> 8.306430060154748
const goodParams_Var100 = {
  baseOrder: 22.5,
  safetyOrder: 32,
  takeProfit: 0.85,
  maxCount: 6,
  safetyOrderDeviation: 2.4,
  safetyOrderVolumeScale: 1.18,
  safetyOrderDeviationScale: 1.06,
};

// -> 17.210171545296703
const goodParams_Var10A = {
  baseOrder: 35,
  safetyOrder: 12,
  takeProfit: 0,
  maxCount: 6,
  safetyOrderDeviation: 5,
  safetyOrderVolumeScale: 1.13,
  safetyOrderDeviationScale: 1.01,
};

// -> 9.438425714845124
const goodParams_Var10B = {
  baseOrder: 19,
  safetyOrder: 34,
  takeProfit: 0.782,
  maxCount: 40,
  safetyOrderDeviation: 2.3,
  safetyOrderVolumeScale: 1.07,
  safetyOrderDeviationScale: 1.06,
};

// -> 9.376393396455413
const goodParams_Var10C = {
  baseOrder: 20,
  safetyOrder: 37,
  takeProfit: 1,
  maxCount: 20,
  safetyOrderDeviation: 2.4,
  safetyOrderVolumeScale: 1.05,
  safetyOrderDeviationScale: 1.07,
};

(async () => {
  const fBase = await fitness({
    baseOrder: 20,
    safetyOrder: 40,
    takeProfit: 1,
    maxCount: 6,
    safetyOrderDeviation: 2.5,
    safetyOrderVolumeScale: 1.2,
    safetyOrderDeviationScale: 1.06,
  });

  const fOpt = await fitness(goodParams_Var10C);

  console.log("fBase:fOpt", fBase, fOpt);
})();
