import { clampConfidence } from "../domain/confidence";

export interface SafetyPolicy {
  lowThreshold: number;
  midThreshold: number;
}

export const DEFAULT_SAFETY_POLICY: SafetyPolicy = {
  lowThreshold: 0.4,
  midThreshold: 0.75,
};

export const GUARANTEE_PATTERNS: readonly RegExp[] = [
  /\bsicher\b/i,
  /\bgarantiert\b/i,
  /\bgarantie\b/i,
  /du kannst (weiter|los)?gehen/i,
  /der weg ist frei/i,
  /freie bahn/i,
  /\bguaranteed\b/i,
  /you can go/i,
  /all clear/i,
];

export interface SafetyReview {
  text: string;
  confidence: number;
  downgraded: boolean;
  reasons: string[];
}

export function containsGuaranteePhrase(text: string): boolean {
  return GUARANTEE_PATTERNS.some((pattern) => pattern.test(text));
}

export class SafetySupervisor {
  constructor(private readonly policy: SafetyPolicy = DEFAULT_SAFETY_POLICY) {}

  review(text: string, confidence: number): SafetyReview {
    const reasons: string[] = [];
    let result = text;

    if (containsGuaranteePhrase(result)) {
      reasons.push("guarantee_phrase_removed");
      result = "Bitte sei vorsichtig. Diese Angabe ist nur eine Vermutung.";
    }

    const value = clampConfidence(confidence);
    if (value < this.policy.lowThreshold) {
      reasons.push("low_confidence");
      result = `Vorsicht: ${result}`;
    } else if (value < this.policy.midThreshold) {
      reasons.push("mid_confidence");
      result = `Eventuell: ${result}`;
    }

    return {
      text: result,
      confidence: value,
      downgraded: reasons.length > 0,
      reasons,
    };
  }
}
