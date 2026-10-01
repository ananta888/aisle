import { observation, type Observation } from "../../src/domain/confidence";
import {
  positionFromBox,
  type ProductCandidate,
} from "../../src/domain/product-candidate";
import type { BoundingBox } from "../../src/domain/types";

export function makeCandidate(
  overrides: Partial<ProductCandidate> = {},
): ProductCandidate {
  const boundingBox: BoundingBox = overrides.boundingBox ?? {
    x: 0.45,
    y: 0.35,
    width: 0.1,
    height: 0.3,
  };
  return {
    target: overrides.target ?? "Oatly Barista",
    detected: overrides.detected ?? true,
    confidence: overrides.confidence ?? 0.9,
    position: overrides.position ?? positionFromBox(boundingBox),
    boundingBox,
  };
}

export function detection(
  overrides: Partial<ProductCandidate> = {},
  confidence?: number,
  source = "test",
  timestamp = 0,
): Observation<ProductCandidate> {
  const candidate = makeCandidate(overrides);
  return observation(
    candidate,
    confidence ?? candidate.confidence,
    source,
    timestamp,
  );
}

export function miss(source = "test", timestamp = 0): Observation<ProductCandidate> {
  return observation(
    makeCandidate({
      detected: false,
      confidence: 0,
      boundingBox: { x: 0.5, y: 0.5, width: 0, height: 0 },
    }),
    0,
    source,
    timestamp,
  );
}
