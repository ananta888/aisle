import { describe, expect, it } from "vitest";
import { parseProductRequest } from "../src/application/product-request";

describe("parseProductRequest", () => {
  it("extracts a product from 'Ich suche ...'", () => {
    expect(parseProductRequest("Ich suche Hafermilch.")?.normalized).toBe(
      "hafermilch",
    );
  });

  it("strips leading articles", () => {
    expect(parseProductRequest("Ich suche die Oatly Barista")?.normalized).toBe(
      "oatly barista",
    );
  });

  it("handles 'wo ist ...'", () => {
    expect(parseProductRequest("wo ist milch")?.normalized).toBe("milch");
  });

  it("falls back to the raw utterance", () => {
    expect(parseProductRequest("Hafermilch")?.normalized).toBe("hafermilch");
  });

  it("returns null for empty or missing input", () => {
    expect(parseProductRequest(null)).toBeNull();
    expect(parseProductRequest("   ")).toBeNull();
  });
});
