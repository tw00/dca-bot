import { IDCABotConfig } from "./dca";

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

const tradeAltsConfig: IDCABotConfig = {
  symbol: "ETH",
  baseOrder: 25,
  safetyOrder: 50,
  takeProfit: 1.5, // percent
  maxCount: 6,
  safetyOrderDeviation: 2.0, // percent
  // safetyOrderDeviation: 7.0 / 1000, // percent
  safetyOrderVolumeScale: 1.05,
  safetyOrderDeviationScale: 1,
};

const vincentConfig: IDCABotConfig = {
  symbol: "ETH",
  baseOrder: 20, // 40
  safetyOrder: 40, // 80
  takeProfit: 1, // percent
  maxCount: 6,
  safetyOrderDeviation: 2.5, // percent
  safetyOrderVolumeScale: 1.2,
  safetyOrderDeviationScale: 1.06,
};

export default {
  TradeAltCoins: tradeAltsConfig,
  Vincent: vincentConfig,
  Test: testConfig,
};

export type ConfigPreset = "Test" | "TradeAltCoins" | "Vincent";
