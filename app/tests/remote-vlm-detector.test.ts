import { describe, expect, it } from "vitest";
import {
  RemoteVlmTargetProductDetector,
  coerceCandidate,
} from "../src/adapters/remote/remote-vlm-detector";
import { targetProduct } from "../src/domain/target-product";

const target = targetProduct("Oatly Barista");

describe("coerceCandidate", () => {
  it("maps a valid VLM payload into a structured candidate", () => {
    const obs = coerceCandidate(
      target,
      {
        target: "Oatly Barista",
        detected: true,
        confidence: 0.88,
        position: { horizontal: "right", vertical: "center" },
        bounding_box: { x: 0.71, y: 0.43, width: 0.12, height: 0.27 },
      },
      "remote-vlm",
      42,
    );
    expect(obs.value.detected).toBe(true);
    expect(obs.confidence).toBeCloseTo(0.88);
    expect(obs.value.position.horizontal).toBe("right");
    expect(obs.value.boundingBox.width).toBeCloseTo(0.12);
    expect(obs.timestamp).toBe(42);
  });

  it("derives position from the box when it is missing", () => {
    const obs = coerceCandidate(target, {
      detected: true,
      confidence: 0.9,
      bounding_box: { x: 0.7, y: 0.4, width: 0.2, height: 0.3 },
    });
    expect(obs.value.position.horizontal).toBe("right");
  });

  it("falls back to an uncertain non-detection on malformed output", () => {
    const obs = coerceCandidate(target, { confidence: 0.9 });
    expect(obs.value.detected).toBe(false);
    expect(obs.confidence).toBe(0);
    expect(obs.uncertainty?.reason).toBe("invalid_vlm_response");
  });

  it("normalizes unknown position values to center", () => {
    const obs = coerceCandidate(target, {
      detected: true,
      confidence: 0.9,
      position: { horizontal: "sideways", vertical: "sideways" },
      bounding_box: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 },
    });
    expect(obs.value.position).toEqual({ horizontal: "center", vertical: "center" });
  });
});

describe("RemoteVlmTargetProductDetector", () => {
  const frame = { data: "data:image/jpeg;base64,AAAA", width: 640, height: 480, timestamp: 1 };

  it("returns a structured candidate from an ok response", async () => {
    const fetcher = (async () => ({
      ok: true,
      json: async () => ({
        detected: true,
        confidence: 0.9,
        bounding_box: { x: 0.6, y: 0.4, width: 0.2, height: 0.3 },
      }),
    })) as unknown as typeof fetch;

    const detector = new RemoteVlmTargetProductDetector({
      endpoint: "/v1/vlm",
      fetcher,
    });
    const obs = await detector.detect({ frame, target });
    expect(obs.value.detected).toBe(true);
    expect(obs.source).toBe("remote-vlm");
  });

  it("returns an uncertain fallback on a failing response", async () => {
    const fetcher = (async () => ({
      ok: false,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const detector = new RemoteVlmTargetProductDetector({
      endpoint: "/v1/vlm",
      fetcher,
    });
    const obs = await detector.detect({ frame, target });
    expect(obs.value.detected).toBe(false);
    expect(obs.uncertainty?.reason).toBe("invalid_vlm_response");
  });

  it("returns an uncertain fallback when the network throws", async () => {
    const fetcher = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;

    const detector = new RemoteVlmTargetProductDetector({
      endpoint: "/v1/vlm",
      fetcher,
    });
    const obs = await detector.detect({ frame, target });
    expect(obs.value.detected).toBe(false);
  });
});
