import { describe, expect, it } from "vitest";
import {
  normalizeProductName,
  sameProduct,
  targetProduct,
} from "../src/domain/target-product";

describe("target product", () => {
  it("normalizes casing, punctuation and leading articles", () => {
    expect(normalizeProductName("Die Oatly Barista!")).toBe("oatly barista");
    expect(normalizeProductName("  Hafermilch  ")).toBe("hafermilch");
    expect(normalizeProductName("the oat milk")).toBe("oat milk");
  });

  it("trims surrounding punctuation and keeps a normalized form", () => {
    const product = targetProduct("  Oatly Barista.  ");
    expect(product.name).toBe("Oatly Barista");
    expect(product.normalized).toBe("oatly barista");
  });

  it("compares products by normalized form", () => {
    expect(
      sameProduct(targetProduct("Oatly Barista"), targetProduct("die Oatly Barista")),
    ).toBe(true);
    expect(sameProduct(targetProduct("Hafermilch"), targetProduct("Sojamilch"))).toBe(
      false,
    );
  });
});
