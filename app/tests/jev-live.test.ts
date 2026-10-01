import { describe, expect, it } from "vitest";
import { JevVisionDecisionDetector } from "../src/adapters/jev/jev-vision-decision-detector";
import { targetProduct } from "../src/domain/target-product";

const url = process.env.AISLE_DECISION_URL;
const imageB64 = process.env.AISLE_DECISION_IMAGE_B64;

const live = url !== undefined && imageB64 !== undefined;

describe.skipIf(!live)("Jev live decision server", () => {
  it("returns a structured observation from the running llama-server", async () => {
    const detector = new JevVisionDecisionDetector({ baseUrl: url!, timeoutMs: 60000 });
    const obs = await detector.detect({
      frame: {
        data: `data:image/png;base64,${imageB64!}`,
        width: 0,
        height: 0,
        timestamp: Date.now(),
      },
      target: targetProduct(process.env.AISLE_DECISION_TARGET ?? "Oatly Barista"),
    });

    expect(["jev-decision"]).toContain(obs.source);
    expect(typeof obs.value.detected).toBe("boolean");
    expect(typeof obs.value.confidence).toBe("number");
    expect(obs.value.position.horizontal).toMatch(/^(left|center|right)$/);
    expect(obs.value.position.vertical).toMatch(/^(up|center|down)$/);
  });
});
