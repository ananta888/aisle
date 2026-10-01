import { describe, expect, it } from "vitest";
import {
  SafetySupervisor,
  containsGuaranteePhrase,
} from "../src/application/safety-supervisor";

const safety = new SafetySupervisor();

describe("SafetySupervisor", () => {
  it("passes confident, neutral statements through unchanged", () => {
    const review = safety.review("Etwas nach rechts.", 0.9);
    expect(review.text).toBe("Etwas nach rechts.");
    expect(review.downgraded).toBe(false);
  });

  it("marks low confidence with a cautious prefix", () => {
    const review = safety.review("Geradeaus.", 0.2);
    expect(review.text.startsWith("Vorsicht:")).toBe(true);
    expect(review.reasons).toContain("low_confidence");
    expect(review.downgraded).toBe(true);
  });

  it("marks mid confidence with an 'eventuell' prefix", () => {
    const review = safety.review("Geradeaus.", 0.6);
    expect(review.text.startsWith("Eventuell:")).toBe(true);
    expect(review.reasons).toContain("mid_confidence");
  });

  it("never lets a guarantee phrase leave the system", () => {
    const review = safety.review("Der Weg ist frei, du kannst weitergehen.", 0.95);
    expect(containsGuaranteePhrase(review.text)).toBe(false);
    expect(review.downgraded).toBe(true);
    expect(review.reasons).toContain("guarantee_phrase_removed");
  });

  it("does not flag innocuous words", () => {
    expect(containsGuaranteePhrase("Schwenke etwas nach links.")).toBe(false);
    expect(containsGuaranteePhrase("Ich bin unsicher.")).toBe(false);
  });
});
