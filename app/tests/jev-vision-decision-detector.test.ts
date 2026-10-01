import { describe, expect, it } from "vitest";
import {
  DEFAULT_JEV_INSTRUCTIONS,
  JevVisionDecisionDetector,
  buildJevRequestBody,
  parseJevDecision,
} from "../src/adapters/jev/jev-vision-decision-detector";
import { targetProduct } from "../src/domain/target-product";

const target = targetProduct("Oatly Barista");

const validPayload = {
  object: "decision",
  results: [
    {
      decision: {
        detected: true,
        horizontal: "right",
        vertical: "center",
        size: "large",
      },
      fields: {
        detected: { value: true, probability: 0.9998, abstain: false },
        horizontal: { value: "right", probability: 0.9809 },
        vertical: { value: "center", probability: 0.6443 },
        size: { value: "large", probability: 0.7674 },
      },
    },
  ],
};

describe("parseJevDecision", () => {
  it("maps a Jev decision into a structured candidate", () => {
    const obs = parseJevDecision(target, validPayload, 0.5, "jev-decision", 7);
    expect(obs.value.detected).toBe(true);
    expect(obs.value.position).toEqual({ horizontal: "right", vertical: "center" });
    expect(obs.value.boundingBox.height).toBeGreaterThan(0.5);
    expect(obs.confidence).toBeCloseTo(0.9998);
    expect(obs.timestamp).toBe(7);
    expect(obs.uncertainty).toBeUndefined();
  });

  it("marks low-probability detections as uncertain", () => {
    const payload = {
      results: [
        {
          fields: {
            detected: { value: true, probability: 0.42 },
            horizontal: { value: "left", probability: 0.5 },
            vertical: { value: "up", probability: 0.5 },
            size: { value: "small", probability: 0.5 },
          },
        },
      ],
    };
    const obs = parseJevDecision(target, payload, 0.5);
    expect(obs.value.detected).toBe(false);
    expect(obs.uncertainty?.reason).toBe("low_confidence_detection");
  });

  it("honours the server-side abstain flag", () => {
    const payload = {
      results: [
        {
          fields: {
            detected: { value: true, probability: 0.99, abstain: true },
            horizontal: { value: "center" },
            vertical: { value: "center" },
            size: { value: "medium" },
          },
        },
      ],
    };
    const obs = parseJevDecision(target, payload, 0.5);
    expect(obs.value.detected).toBe(false);
    expect(obs.uncertainty?.reason).toBe("jev_abstained");
  });

  it("reports not detected without inventing a position", () => {
    const payload = {
      results: [
        {
          fields: {
            detected: { value: false, probability: 0.95 },
            horizontal: { value: "center" },
            vertical: { value: "center" },
            size: { value: "small" },
          },
        },
      ],
    };
    const obs = parseJevDecision(target, payload, 0.5);
    expect(obs.value.detected).toBe(false);
    expect(obs.confidence).toBe(0);
    expect(obs.uncertainty?.reason).toBe("target_not_detected");
  });

  it("falls back on malformed payloads", () => {
    expect(
      parseJevDecision(target, { results: [] }).uncertainty?.reason,
    ).toBe("invalid_decision_response");
    expect(
      parseJevDecision(target, { results: [{ fields: {} }] }).uncertainty?.reason,
    ).toBe("invalid_detected_field");
  });
});

describe("buildJevRequestBody", () => {
  const frame = {
    data: "data:image/jpeg;base64,AAAA",
    width: 640,
    height: 480,
    timestamp: 1,
  };

  it("builds a tree-mode, probability-returning decision request", () => {
    const body = buildJevRequestBody(target, frame, { baseUrl: "http://x" });
    expect(body.mode).toBe("tree");
    expect(body.return_probs).toBe(true);
    expect(body.instructions).toBe(DEFAULT_JEV_INSTRUCTIONS);
    const schema = body.schema as Record<string, { type: string }>;
    expect(schema.detected?.type).toBe("boolean");
    expect(schema.horizontal?.type).toBe("enum");
    const contexts = body.contexts as Array<Array<{ type: string }>>;
    expect(contexts[0]?.[0]?.type).toBe("image_url");
  });
});

describe("JevVisionDecisionDetector", () => {
  const frame = {
    data: "data:image/jpeg;base64,AAAA",
    width: 640,
    height: 480,
    timestamp: 2,
  };

  it("posts to /v1/decision and parses the response", async () => {
    let seenUrl = "";
    const fetcher = (async (url: string) => {
      seenUrl = url;
      return { ok: true, json: async () => validPayload };
    }) as unknown as typeof fetch;

    const detector = new JevVisionDecisionDetector({
      baseUrl: "http://127.0.0.1:18150/",
      fetcher,
    });
    const obs = await detector.detect({ frame, target });
    expect(seenUrl).toBe("http://127.0.0.1:18150/v1/decision");
    expect(obs.value.detected).toBe(true);
    expect(obs.source).toBe("jev-decision");
  });

  it("falls back when the server errors", async () => {
    const fetcher = (async () => ({
      ok: false,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    const detector = new JevVisionDecisionDetector({ baseUrl: "http://x", fetcher });
    const obs = await detector.detect({ frame, target });
    expect(obs.value.detected).toBe(false);
    expect(obs.uncertainty?.reason).toBe("decision_http_error");
  });

  it("falls back when the network throws", async () => {
    const fetcher = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const detector = new JevVisionDecisionDetector({ baseUrl: "http://x", fetcher });
    const obs = await detector.detect({ frame, target });
    expect(obs.uncertainty?.reason).toBe("decision_unreachable");
  });

  it("rejects non-serializable frames", async () => {
    const detector = new JevVisionDecisionDetector({ baseUrl: "http://x" });
    const obs = await detector.detect({
      frame: { data: { raw: true }, width: 1, height: 1, timestamp: 0 },
      target,
    });
    expect(obs.uncertainty?.reason).toBe("frame_not_serializable");
  });
});
