import { describe, expect, it } from "vitest";
import {
  clampConfidence,
  isConfident,
  observation,
} from "../src/domain/confidence";

describe("confidence", () => {
  it("clamps values into [0, 1]", () => {
    expect(clampConfidence(1.4)).toBe(1);
    expect(clampConfidence(-0.2)).toBe(0);
    expect(clampConfidence(0.51)).toBeCloseTo(0.51);
  });

  it("treats non-finite values as zero", () => {
    expect(clampConfidence(Number.NaN)).toBe(0);
    expect(clampConfidence(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("builds observations with source and timestamp", () => {
    const obs = observation("value", 0.51, "ocr:tesseract", 123, {
      reason: "blurry",
      suggestedAction: "rescan",
    });
    expect(obs.value).toBe("value");
    expect(obs.confidence).toBeCloseTo(0.51);
    expect(obs.source).toBe("ocr:tesseract");
    expect(obs.timestamp).toBe(123);
    expect(obs.uncertainty?.suggestedAction).toBe("rescan");
  });

  it("compares confidence against a threshold", () => {
    expect(isConfident(observation("x", 0.8, "t", 0), 0.75)).toBe(true);
    expect(isConfident(observation("x", 0.5, "t", 0), 0.75)).toBe(false);
  });
});
