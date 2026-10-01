export type Confidence = number;

export type UncertaintyAction =
  | "rescan"
  | "ask_user"
  | "continue_cautious"
  | "stop";

export interface Uncertainty {
  reason: string;
  suggestedAction?: UncertaintyAction;
}

export interface Observation<T> {
  value: T;
  confidence: Confidence;
  source: string;
  timestamp: number;
  uncertainty?: Uncertainty;
}

export function clampConfidence(value: number): Confidence {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function observation<T>(
  value: T,
  confidence: number,
  source: string,
  timestamp: number,
  uncertainty?: Uncertainty,
): Observation<T> {
  return {
    value,
    confidence: clampConfidence(confidence),
    source,
    timestamp,
    ...(uncertainty ? { uncertainty } : {}),
  };
}

export function isConfident(
  item: Observation<unknown>,
  threshold: number,
): boolean {
  return item.confidence >= threshold;
}
