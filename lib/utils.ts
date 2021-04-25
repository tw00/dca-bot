import { IHistoricalData } from "./db";

export function guessPrice(candle: IHistoricalData): number {
  return (candle.low + candle.high) / 2;
}

export function range(from: number, to: number): number[] {
  return [...Array(to - from + 1).keys()].map((v) => v + from);
}
