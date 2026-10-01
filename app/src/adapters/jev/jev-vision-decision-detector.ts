import {
  clampConfidence,
  observation,
  type Observation,
} from "../../domain/confidence";
import type { ProductCandidate } from "../../domain/product-candidate";
import type { TargetProduct } from "../../domain/target-product";
import type {
  BoundingBox,
  Horizontal,
  RelativePosition,
  Vertical,
} from "../../domain/types";
import type {
  DetectorRequest,
  TargetProductDetector,
} from "../../ports/target-product-detector";

export interface JevVisionDecisionConfig {
  baseUrl: string;
  model?: string;
  instructions?: string;
  minProbability?: number;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  source?: string;
}

export const DEFAULT_JEV_INSTRUCTIONS =
  "You look at a photo of supermarket shelves. Answer every field for the requested product.";

export const DEFAULT_JEV_MIN_PROBABILITY = 0.5;

const DEFAULT_TIMEOUT_MS = 20000;

const HORIZONTALS: readonly Horizontal[] = ["left", "center", "right"];
const VERTICALS: readonly Vertical[] = ["up", "center", "down"];
const SIZES = ["small", "medium", "large"] as const;
type Size = (typeof SIZES)[number];

const SIZE_HEIGHT: Record<Size, number> = { small: 0.15, medium: 0.35, large: 0.6 };
const HORIZONTAL_CENTER: Record<Horizontal, number> = { left: 0.2, center: 0.5, right: 0.8 };
const VERTICAL_CENTER: Record<Vertical, number> = { up: 0.2, center: 0.5, down: 0.8 };

export interface JevField {
  value: unknown;
  probability: number;
  abstain: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function readField(fields: Record<string, unknown>, key: string): JevField | null {
  const raw = asRecord(fields[key]);
  if (!raw || !("value" in raw)) return null;
  const probability =
    typeof raw.probability === "number" && Number.isFinite(raw.probability)
      ? clampConfidence(raw.probability)
      : 0;
  return { value: raw.value, probability, abstain: raw.abstain === true };
}

function asHorizontal(value: unknown): Horizontal {
  return HORIZONTALS.includes(value as Horizontal)
    ? (value as Horizontal)
    : "center";
}

function asVertical(value: unknown): Vertical {
  return VERTICALS.includes(value as Vertical) ? (value as Vertical) : "center";
}

function asSize(value: unknown): Size {
  return SIZES.includes(value as Size) ? (value as Size) : "medium";
}

function boxFor(
  horizontal: Horizontal,
  vertical: Vertical,
  size: Size,
): BoundingBox {
  const height = SIZE_HEIGHT[size];
  const width = Math.max(0.05, height * 0.5);
  const x = Math.max(0, HORIZONTAL_CENTER[horizontal] - width / 2);
  const y = Math.max(0, VERTICAL_CENTER[vertical] - height / 2);
  return { x, y, width, height };
}

function fallback(
  target: TargetProduct,
  source: string,
  timestamp: number,
  reason: string,
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
    { reason, suggestedAction: "rescan" },
  );
}

export function parseJevDecision(
  target: TargetProduct,
  payload: unknown,
  minProbability = DEFAULT_JEV_MIN_PROBABILITY,
  source = "jev-decision",
  timestamp = 0,
): Observation<ProductCandidate> {
  const root = asRecord(payload);
  const results = root?.results;
  const first = Array.isArray(results) ? asRecord(results[0]) : null;
  const fields = first ? asRecord(first.fields) : null;
  if (!fields) return fallback(target, source, timestamp, "invalid_decision_response");

  const detected = readField(fields, "detected");
  if (!detected || typeof detected.value !== "boolean") {
    return fallback(target, source, timestamp, "invalid_detected_field");
  }

  const horizontal = asHorizontal(readField(fields, "horizontal")?.value);
  const vertical = asVertical(readField(fields, "vertical")?.value);
  const size = asSize(readField(fields, "size")?.value);
  const position: RelativePosition = { horizontal, vertical };
  const boundingBox = boxFor(horizontal, vertical, size);

  const lowConfidence = detected.probability < minProbability;
  const detectedValue = detected.value;
  const uncertain = !detectedValue || lowConfidence || detected.abstain;

  const confidence = detectedValue ? detected.probability : 0;
  const candidate: ProductCandidate = {
    target: target.name,
    detected: detectedValue && !uncertain,
    confidence: uncertain ? Math.min(confidence, minProbability) : confidence,
    position,
    boundingBox,
  };

  const uncertaintyReason = detected.abstain
    ? "jev_abstained"
    : lowConfidence
      ? "low_confidence_detection"
      : "target_not_detected";

  return observation(
    candidate,
    candidate.confidence,
    source,
    timestamp,
    uncertain
      ? { reason: uncertaintyReason, suggestedAction: detectedValue ? "continue_cautious" : "rescan" }
      : undefined,
  );
}

export function buildJevRequestBody(
  target: TargetProduct,
  frame: DetectorRequest["frame"],
  config: JevVisionDecisionConfig,
): Record<string, unknown> {
  const minProbability = config.minProbability ?? DEFAULT_JEV_MIN_PROBABILITY;
  return {
    ...(config.model ? { model: config.model } : {}),
    instructions: config.instructions ?? DEFAULT_JEV_INSTRUCTIONS,
    mode: "tree",
    return_probs: true,
    cache_context: false,
    schema: {
      detected: {
        type: "boolean",
        description: `Is "${target.name}" visible in the image?`,
        abstain: { min_probability: minProbability },
      },
      horizontal: {
        type: "enum",
        choices: HORIZONTALS,
        description: `Horizontal position of "${target.name}".`,
      },
      vertical: {
        type: "enum",
        choices: VERTICALS,
        description: `Vertical position of "${target.name}".`,
      },
      size: {
        type: "enum",
        choices: SIZES,
        description: `How much of the image height "${target.name}" covers.`,
      },
    },
    contexts: [
      [
        { type: "image_url", image_url: { url: frame.data } },
        { type: "text", text: `Answer the fields for "${target.name}".` },
      ],
    ],
  };
}

export class JevVisionDecisionDetector implements TargetProductDetector {
  private readonly source: string;

  constructor(private readonly config: JevVisionDecisionConfig) {
    this.source = config.source ?? "jev-decision";
  }

  async detect(
    request: DetectorRequest,
  ): Promise<Observation<ProductCandidate>> {
    const { target, frame } = request;
    if (typeof frame.data !== "string") {
      return fallback(target, this.source, frame.timestamp, "frame_not_serializable");
    }

    const fetcher = this.config.fetcher ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    const url = `${this.config.baseUrl.replace(/\/+$/, "")}/v1/decision`;

    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildJevRequestBody(target, frame, this.config)),
        signal: controller.signal,
      });
      if (!response.ok) {
        return fallback(target, this.source, Date.now(), "decision_http_error");
      }
      const payload: unknown = await response.json();
      return parseJevDecision(
        target,
        payload,
        this.config.minProbability ?? DEFAULT_JEV_MIN_PROBABILITY,
        this.source,
        Date.now(),
      );
    } catch {
      return fallback(target, this.source, Date.now(), "decision_unreachable");
    } finally {
      clearTimeout(timeout);
    }
  }
}
