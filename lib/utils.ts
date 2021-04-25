export function guessPrice(candle) {
  return (candle.low + candle.high) / 2;
}

export function range(from, to) {
  return [...Array(to - from + 1).keys()].map((v) => v + from);
}
