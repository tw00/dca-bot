import { IDCABotConfig } from "./dca";

const defaultConfig: IDCABotConfig = {
  symbol: "ETH",
  baseOrder: 25,
  safetyOrder: 50,
  takeProfit: 1.5, // percent
  maxCount: 6,
  safetyOrderDeviation: 2.0, // percent
  // safetyOrderDeviation: 2.0 / 56000, // percent
  safetyOrderVolumeScale: 1.05,
  safetyOrderDeviationScale: 1.01,
};

const testConfig: IDCABotConfig = {
  symbol: "ETH",
  baseOrder: 25,
  safetyOrder: 50,
  takeProfit: 1.5, // percent
  maxCount: 6,
  safetyOrderDeviation: 2.0, // percent
  safetyOrderVolumeScale: 1.05,
  safetyOrderDeviationScale: 1.01,
};

// BO 20 / SO 40 (40/80)
// Take profit: 1%
// Max safety order count: 6
// Safety order deviation: 2.5
// Safety order volume scale: 1.2
// Safety order deviation scale: 1.06

export default {
  TradeAltCoins: defaultConfig,
  Test: testConfig,
};
