import {
  clampConfidence,
  observation,
  type Observation,
} from "../../domain/confidence";

export interface WhisperDecisionConfig {
  baseUrl: string;
  language?: string;
  productChoices?: string[];
  minCoverage?: number;
  minProbability?: number;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  source?: string;
}

export interface WhisperDecisionResult {
  intent: string | null;
  intentStatus: string;
  confirmed: boolean | null;
  product: string | null;
  transcript: string | null;
  fallbackUsed: boolean;
  confidence: number;
}

export const DEFAULT_WHISPER_MIN_COVERAGE = 0.001;
export const DEFAULT_WHISPER_MIN_PROBABILITY = 0.5;
const DEFAULT_TIMEOUT_MS = 15000;

export const INTENT_CHOICES = [
  {
    label: "find_product",
    verbalizers: [
      "i am looking for",
      "i'm looking for",
      "i am searching for",
      "search for",
      "find",
      "where is",
      "ich suche",
      "suche",
      "wo ist",
      "ich brauche",
    ],
  },
  { label: "cancel", verbalizers: ["cancel", "abbrechen"] },
  { label: "stop", verbalizers: ["stop", "stopp", "halt"] },
  { label: "repeat", verbalizers: ["repeat", "nochmal", "wiederhole"] },
];

export function buildWhisperDecisionRequest(
  audioBase64: string,
  config: WhisperDecisionConfig,
): Record<string, unknown> {
  const minCoverage = config.minCoverage ?? DEFAULT_WHISPER_MIN_COVERAGE;
  const minProbability = config.minProbability ?? DEFAULT_WHISPER_MIN_PROBABILITY;

  const schema: Record<string, unknown> = {
    intent: {
      type: "enum",
      mode: "keyword",
      choices: INTENT_CHOICES,
      abstain: { min_coverage: minCoverage, min_probability: minProbability },
    },
    confirmed: {
      type: "boolean",
      verbalizers: {
        true: ["yes", "correct", "ja", "richtig"],
        false: ["no", "wrong", "nein", "falsch"],
      },
    },
  };

  if (config.productChoices && config.productChoices.length > 0) {
    schema.product = {
      type: "enum",
      mode: "constrained_asr",
      choices: config.productChoices,
      abstain: { min_coverage: minCoverage, min_probability: minProbability },
    };
  }

  return {
    schema,
    options: {
      language: config.language ?? "de",
      fallback: "transcribe",
      return_candidates: false,
    },
    audio: { data: audioBase64 },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function fieldValue(fields: Record<string, unknown>, key: string): unknown {
  const field = asRecord(fields[key]);
  if (!field || field.status !== "ok") return null;
  return field.value ?? null;
}

function fieldConfidence(
  fields: Record<string, unknown>,
  key: string,
): number {
  const field = asRecord(fields[key]);
  if (!field) return 0;
  const raw = field.confidence ?? field.probability;
  return typeof raw === "number" && Number.isFinite(raw) ? clampConfidence(raw) : 0;
}

function fieldStatus(fields: Record<string, unknown>, key: string): string {
  return asRecord(fields[key])?.status?.toString() ?? "missing";
}

export function parseWhisperDecision(payload: unknown): WhisperDecisionResult {
  const root = asRecord(payload);
  const fields = root ? asRecord(root.fields) : null;
  if (!fields) {
    return {
      intent: null,
      intentStatus: "invalid",
      confirmed: null,
      product: null,
      transcript: null,
      fallbackUsed: false,
      confidence: 0,
    };
  }

  const intentRaw = fieldValue(fields, "intent");
  const intent = typeof intentRaw === "string" ? intentRaw : null;

  const confirmedRaw = fieldValue(fields, "confirmed");
  const confirmed = typeof confirmedRaw === "boolean" ? confirmedRaw : null;

  const productRaw = fieldValue(fields, "product");
  const product = typeof productRaw === "string" ? productRaw : null;

  const fallback = asRecord(root?.fallback);
  const transcriptRaw = fallback?.transcript;
  const transcript = typeof transcriptRaw === "string" ? transcriptRaw : null;

  return {
    intent,
    intentStatus: fieldStatus(fields, "intent"),
    confirmed,
    product,
    transcript,
    fallbackUsed: fallback?.used === true,
    confidence: fieldConfidence(fields, "intent"),
  };
}

export class WhisperDecisionClient {
  private readonly source: string;

  constructor(private readonly config: WhisperDecisionConfig) {
    this.source = config.source ?? "whisper-decision";
  }

  async recognize(audioBase64: string): Promise<Observation<WhisperDecisionResult>> {
    const fetcher = this.config.fetcher ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    const url = `${this.config.baseUrl.replace(/\/+$/, "")}/v1/audio/decisions`;

    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildWhisperDecisionRequest(audioBase64, this.config)),
        signal: controller.signal,
      });
      if (!response.ok) {
        return this.uncertain("whisper_http_error");
      }
      const payload: unknown = await response.json();
      const result = parseWhisperDecision(payload);
      const uncertain =
        result.intent === null && result.transcript === null;
      return observation(
        result,
        result.confidence,
        this.source,
        Date.now(),
        uncertain ? { reason: result.intentStatus, suggestedAction: "ask_user" } : undefined,
      );
    } catch {
      return this.uncertain("whisper_unreachable");
    } finally {
      clearTimeout(timeout);
    }
  }

  private uncertain(
    reason: string,
  ): Observation<WhisperDecisionResult> {
    return observation(
      {
        intent: null,
        intentStatus: reason,
        confirmed: null,
        product: null,
        transcript: null,
        fallbackUsed: false,
        confidence: 0,
      } satisfies WhisperDecisionResult,
      0,
      this.source,
      Date.now(),
      { reason, suggestedAction: "ask_user" },
    );
  }
}
