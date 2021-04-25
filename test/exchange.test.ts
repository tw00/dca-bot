import { getDiscountedFee } from "../lib/fee";

describe("Exchange", () => {
  it("fee", () => {
    const fee = getDiscountedFee(123 * 1e3);
    expect(fee.tier).toBe("$100k - $1m");
    expect(fee.takerFee).toBe(0.2);
  });

  it("fee with overflow", () => {
    const fee = getDiscountedFee(1e15);
    expect(fee.tier).toBe("$1b+");
    expect(fee.takerFee).toBe(0.04);
  });

  it("fee with negative numbers", () => {
    expect(() => getDiscountedFee(-1)).toThrow(
      "volumeLast30Days must be positive"
    );
  });
});
