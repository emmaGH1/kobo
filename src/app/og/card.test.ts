import { describe, expect, it } from "vitest";
import { formatNaira } from "./card";

describe("summary card naira formatting", () => {
  it("formats integer kobo without losing fractional amounts", () => {
    expect(formatNaira(380000)).toBe("₦3,800");
    expect(formatNaira(380050)).toBe("₦3,800.50");
    expect(formatNaira(1)).toBe("₦0.01");
  });
  it("rejects invalid ledger amounts", () => {
    for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN]) {
      expect(() => formatNaira(value)).toThrow();
    }
  });
});
