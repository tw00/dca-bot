export function guessPrice(candle) {
  return (candle.low + candle.high) / 2;
}
