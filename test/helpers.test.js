const { formatCurrency, getDollarPrefix } = require("../helpers");

describe("currency formatting", () => {
  test("formats USD without decimals when it's an even dollar amount", () => {
    const expected = "$100";
    expect(formatCurrency("US", "usd", 10000)).toBe(expected);
  });

  test("formats USD with decimals when there are cents", () => {
    const expected = "$100.50";
    expect(formatCurrency("US", "usd", 10050)).toBe(expected);
  });

  test("formats EUR", () => {
    const expected = "€100";
    expect(formatCurrency("DE", "eur", 10000)).toBe(expected);
  });

  test("formats GBP", () => {
    const expected = "£100";
    expect(formatCurrency("UK", "gbp", 10000)).toBe(expected);
  });

  test("formats CHF", () => {
    const expected = "CHF 100";
    expect(formatCurrency("CH", "chf", 10000)).toBe(expected);
  });

  test("gets dollar prefixes", () => {
    expect(getDollarPrefix("nzd")).toBe("NZ$");
    expect(getDollarPrefix("aud")).toBe("AU$");
    expect(getDollarPrefix("cad")).toBe("CA$");
    expect(getDollarPrefix("zar")).toBe("ZAR$");
  });

  test("formats NZD", () => {
    const expected = "NZ$100";
    expect(formatCurrency("NZ", "nzd", 10000)).toBe(expected);
  });

  test("formats AUD", () => {
    const expected = "AU$100";
    expect(formatCurrency("AU", "aud", 10000)).toBe(expected);
  });

  test("formats CAD", () => {
    const expected = "CA$100";
    expect(formatCurrency("CA", "cad", 10000)).toBe(expected);
  });

  test("formats SEK", () => {
    const expected = "100 kr";
    expect(formatCurrency("SE", "sek", 10000)).toBe(expected);
  });

  test("formats PLN", () => {
    const expected = "PLN 100";
    expect(formatCurrency("PL", "pln", 10000)).toBe(expected);
  });

  test("formats zero-decimal currency", () => {
    const expected = "¥100";
    expect(formatCurrency("JP", "jpy", "100")).toBe(expected);
  });

  test("formats three-decimal currency", () => {
    const expected = "BHD 100.000";
    expect(formatCurrency("BH", "bhd", "100000")).toBe(expected);
  });

  test("formats USD without prefix unless forced", () => {
    const expected = "$50";
    expect(formatCurrency("US", "usd", "5000")).toBe(expected);
  });

  test("formats USD with prefix if forced", () => {
    const expected = "US$50";
    expect(formatCurrency("US", "usd", "5000", true)).toBe(expected);
  });
});
