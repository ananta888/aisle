import {
  observation,
  type Confidence,
  type Observation,
} from "../../domain/confidence";
import {
  positionFromBox,
  type ProductCandidate,
} from "../../domain/product-candidate";
import type { TargetProduct } from "../../domain/target-product";
import type {
  Horizontal,
  Vertical,
} from "../../domain/types";
import type {
  DetectorRequest,
  TargetProductDetector,
} from "../../ports/target-product-detector";

export interface RemoteVlmConfig {
  endpoint: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  source?: string;
}

const HORIZONTALS: ReadonlySet<string> = new Set(["left", "center", "right"]);
const VERTICALS: ReadonlySet<string> = new Set(["up", "center", "down"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function asHorizontal(value: unknown): Horizontal {
  return typeof value === "string" && HORIZONTALS.has(value)
    ? (value as Horizontal)
    : "center";
}

function asVertical(value: unknown): Vertical {
  return typeof value === "string" && VERTICALS.has(value)
    ? (value as Vertical)
    : "center";
}

export function coerceCandidate(
  target: TargetProduct,
  raw: unknown,
  source = "remote-vlm",
  timestamp = 0,
): Observation<ProductCandidate> {
  const record = asRecord(raw);
  if (!record || typeof record.detected !== "boolean") {
    return uncertaintyFallback(target, source, timestamp);
  }

  const boxRecord = asRecord(record.bounding_box) ?? asRecord(record.boundingBox);
  if (!boxRecord) return uncertaintyFallback(target, source, timestamp);

  const boundingBox = {
    x: clamp01(asNumber(boxRecord.x, 0)),
    y: clamp01(asNumber(boxRecord.y, 0)),
    width: clamp01(asNumber(boxRecord.width, 0)),
    height: clamp01(asNumber(boxRecord.height, 0)),
  };

  const confidence: Confidence = clamp01(asNumber(record.confidence, 0));
  const positionRecord = asRecord(record.position);
  const position = positionRecord
    ? {
        horizontal: asHorizontal(positionRecord.horizontal),
        vertical: asVertical(positionRecord.vertical),
      }
    : positionFromBox(boundingBox);

  const detected = record.detected;
  const candidate: ProductCandidate = {
    target: target.name,
    detected,
    confidence: detected ? confidence : 0,
    position,
    boundingBox,
  };

  const uncertain = !detected || confidence < 0.4;
  return observation(
    candidate,
    detected ? confidence : 0,
    source,
    timestamp,
    uncertain
      ? {
          reason: detected
            ? "low_confidence_detection"
            : "target_not_detected",
          suggestedAction: detected ? "continue_cautious" : "rescan",
        }
      : undefined,
  );
}

function uncertaintyFallback(
  target: TargetProduct,
  source: string,
  timestamp: number,
): Observation<ProductCandidate> {
  return observation(
    {
      target: target.name,
      detected: false,
      confidence: 0,
      position: { horizontal: "center", vertical: "center" },
      boundingBox: { x: 0.5, y: 0.5, width: 0, height: 0 },
    } satisfies ProductCandidate,
    0,
    source,
    timestamp,
    {
      reason: "invalid_vlm_response",
      suggestedAction: "rescan",
    },
  );
}

export class RemoteVlmTargetProductDetector implements TargetProductDetector {
  private readonly source: string;

  constructor(private readonly config: RemoteVlmConfig) {
    this.source = config.source ?? "remote-vlm";
  }

  async detect(
    request: DetectorRequest,
  ): Promise<Observation<ProductCandidate>> {
    const fetcher = this.config.fetcher ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? 8000,
    );

    try {
      const response = await fetcher(this.config.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target: request.target.name,
          image: request.frame.data,
          width: request.frame.width,
          height: request.frame.height,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        return uncertaintyFallback(request.target, this.source, Date.now());
      }
      const payload: unknown = await response.json();
      return coerceCandidate(request.target, payload, this.source, Date.now());
    } catch {
      return uncertaintyFallback(request.target, this.source, Date.now());
    } finally {
      clearTimeout(timeout);
    }
  }
}
