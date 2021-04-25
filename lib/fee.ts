import { strict as assert } from "assert";

interface IFeeTabEntry {
  thres: number;
  tier: string;
  takerFee: number; // percentage
  makerFee: number; // percentage
}

const feeCoinbase: IFeeTabEntry[] = [
  { thres: 0, tier: "Up to $10k", takerFee: 0.5, makerFee: 0.5 },
  { thres: 10 * 1e3, tier: "$10k - $50k", takerFee: 0.35, makerFee: 0.35 },
  { thres: 50 * 1e3, tier: "$50k - $100k", takerFee: 0.25, makerFee: 0.15 },
  { thres: 100 * 1e3, tier: "$100k - $1m", takerFee: 0.2, makerFee: 0.1 },
  { thres: 1 * 1e6, tier: "$1m - $10m", takerFee: 0.18, makerFee: 0.08 },
  { thres: 10 * 1e6, tier: "$10m - $50m", takerFee: 0.15, makerFee: 0.05 },
  { thres: 50 * 1e6, tier: "$50m - $100m", takerFee: 0.1, makerFee: 0.0 },
  { thres: 100 * 1e6, tier: "$100m - $300m", takerFee: 0.07, makerFee: 0.0 },
  { thres: 300 * 1e6, tier: "$300m - $500m", takerFee: 0.05, makerFee: 0.0 },
  { thres: 500 * 1e6, tier: "$500m - $1b", takerFee: 0.04, makerFee: 0.0 },
  { thres: 1e9, tier: "$1b+", takerFee: 0.04, makerFee: 0.0 },
];

const fees = {
  coinbase: feeCoinbase,
};

export function getDiscountedFee(
  volumeLast30Days: number,
  exchange = "coinbase"
): IFeeTabEntry {
  assert(volumeLast30Days >= 0, "volumeLast30Days must be positive");
  const fee = fees[exchange];
  const idx = fee.findIndex((x) => volumeLast30Days < x.thres);
  return fee[(idx === -1 ? fee.length : idx) - 1];
}
