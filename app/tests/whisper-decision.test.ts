import { describe, expect, it } from "vitest";
import {
  WhisperDecisionClient,
  buildWhisperDecisionRequest,
  parseWhisperDecision,
} from "../src/adapters/whisper/whisper-decision-client";
import { WhisperDecisionSpeechInput } from "../src/adapters/whisper/whisper-decision-speech-input";
import type { AudioClip, AudioRecorder } from "../src/ports/audio-recorder";

const okPayload = {
  object: "audio.decision",
  api_version: "audio.decision.v1",
  decision: { intent: "find_product", confirmed: null },
  fields: {
    intent: { status: "ok", value: "find_product", probability: 0.9, coverage: 0.5, confidence: 0.88 },
    confirmed: { status: "abstain", value: null, reasons: ["out_of_set"] },
  },
  fallback: { used: true, transcript: "Ich suche Hafermilch." },
};

describe("buildWhisperDecisionRequest", () => {
  it("sends a keyword intent schema with abstain thresholds and transcribe fallback", () => {
    const body = buildWhisperDecisionRequest("AAAA", { baseUrl: "http://x", language: "de" });
    const options = body.options as Record<string, unknown>;
    expect(options.language).toBe("de");
    expect(options.fallback).toBe("transcribe");
    const schema = body.schema as Record<string, { abstain?: { min_coverage: number } }>;
    expect(schema.intent?.abstain?.min_coverage).toBeGreaterThan(0);
    expect((body.audio as { data: string }).data).toBe("AAAA");
  });

  it("adds a product enum only when choices are given", () => {
    const without = buildWhisperDecisionRequest("A", { baseUrl: "http://x" });
    expect((without.schema as Record<string, unknown>).product).toBeUndefined();
    const with_ = buildWhisperDecisionRequest("A", {
      baseUrl: "http://x",
      productChoices: ["Hafermilch", "Sojamilch"],
    });
    expect((with_.schema as Record<string, unknown>).product).toBeDefined();
  });
});

describe("parseWhisperDecision", () => {
  it("reads typed fields and the transcription fallback", () => {
    const result = parseWhisperDecision(okPayload);
    expect(result.intent).toBe("find_product");
    expect(result.intentStatus).toBe("ok");
    expect(result.confirmed).toBeNull();
    expect(result.transcript).toBe("Ich suche Hafermilch.");
    expect(result.fallbackUsed).toBe(true);
    expect(result.confidence).toBeCloseTo(0.88);
  });

  it("treats abstain as no value", () => {
    const result = parseWhisperDecision({
      fields: { intent: { status: "abstain", value: "cancel" } },
    });
    expect(result.intent).toBeNull();
    expect(result.intentStatus).toBe("abstain");
  });

  it("survives malformed payloads", () => {
    const result = parseWhisperDecision({ object: "error" });
    expect(result.intentStatus).toBe("invalid");
    expect(result.transcript).toBeNull();
  });
});

class FakeRecorder implements AudioRecorder {
  constructor(private readonly clip: AudioClip | null) {}
  isAvailable(): boolean {
    return true;
  }
  async recordOnce(): Promise<AudioClip | null> {
    return this.clip;
  }
}

function clientWith(payload: unknown, ok = true): WhisperDecisionClient {
  const fetcher = (async () => ({ ok, json: async () => payload })) as unknown as typeof fetch;
  return new WhisperDecisionClient({ baseUrl: "http://x", fetcher });
}

const clip: AudioClip = { base64: "AAAA", mimeType: "audio/wav", durationMs: 1000 };

describe("WhisperDecisionSpeechInput", () => {
  it("returns the transcription fallback for a product request", async () => {
    const input = new WhisperDecisionSpeechInput({
      recorder: new FakeRecorder(clip),
      client: clientWith(okPayload),
    });
    expect(await input.listenOnce()).toBe("Ich suche Hafermilch.");
    expect(input.lastResult?.intent).toBe("find_product");
  });

  it("returns the direct product label when one is decided", async () => {
    const input = new WhisperDecisionSpeechInput({
      recorder: new FakeRecorder(clip),
      client: clientWith({
        fields: { product: { status: "ok", value: "Hafermilch", confidence: 0.95 } },
      }),
    });
    expect(await input.listenOnce()).toBe("Hafermilch");
  });

  it("does not turn cancel/stop into a product", async () => {
    const input = new WhisperDecisionSpeechInput({
      recorder: new FakeRecorder(clip),
      client: clientWith({
        fields: { intent: { status: "ok", value: "stop", confidence: 0.9 } },
        fallback: { used: false, transcript: "stop" },
      }),
    });
    expect(await input.listenOnce()).toBeNull();
  });

  it("returns null when no audio was captured", async () => {
    const input = new WhisperDecisionSpeechInput({
      recorder: new FakeRecorder(null),
      client: clientWith(okPayload),
    });
    expect(await input.listenOnce()).toBeNull();
  });

  it("returns null on a server error", async () => {
    const input = new WhisperDecisionSpeechInput({
      recorder: new FakeRecorder(clip),
      client: clientWith({}, false),
    });
    expect(await input.listenOnce()).toBeNull();
  });
});
