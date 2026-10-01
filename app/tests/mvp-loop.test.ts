import { describe, expect, it } from "vitest";
import { RecordingSpeechOutput } from "../src/adapters/dummy/recording-speech-output";
import { ScriptedSpeechInput } from "../src/adapters/dummy/scripted-speech-input";
import { MvpLoop } from "../src/application/orchestrator";
import { containsGuaranteePhrase } from "../src/application/safety-supervisor";
import { detection, miss } from "./support/factories";

const largeBox = { x: 0.4, y: 0.2, width: 0.3, height: 0.6 };
const smallBox = { x: 0.45, y: 0.45, width: 0.1, height: 0.1 };

function build(utterances: (string | null)[]) {
  const speechOutput = new RecordingSpeechOutput();
  const loop = new MvpLoop({
    speechInput: new ScriptedSpeechInput(utterances),
    speechOutput,
  });
  return { loop, speechOutput };
}

describe("MVP closed loop", () => {
  it("runs the reference scenario end to end", async () => {
    const { loop, speechOutput } = build(["Ich suche Hafermilch."]);

    const product = await loop.requestProduct();
    expect(product?.normalized).toBe("hafermilch");
    expect(loop.currentState).toBe("SEARCHING");
    expect(speechOutput.lastText).toBe("Ich suche nach Hafermilch.");

    const right = loop.processFrame(
      detection(
        {
          position: { horizontal: "right", vertical: "center" },
          boundingBox: { x: 0.7, y: 0.4, width: 0.15, height: 0.25 },
        },
        0.82,
      ),
    );
    expect(right.state).toBe("TARGET_CANDIDATE");
    expect(right.instruction.text).toBe("Etwas nach rechts.");

    const rightAgain = loop.processFrame(
      detection(
        {
          position: { horizontal: "right", vertical: "center" },
          boundingBox: { x: 0.68, y: 0.4, width: 0.15, height: 0.28 },
        },
        0.88,
      ),
    );
    expect(rightAgain.state).toBe("TARGET_TRACKED");

    const steady = loop.processFrame(
      detection(
        {
          position: { horizontal: "right", vertical: "center" },
          boundingBox: { x: 0.68, y: 0.4, width: 0.15, height: 0.28 },
        },
        0.9,
      ),
    );
    expect(steady.state).toBe("GUIDING");

    const straight = loop.processFrame(
      detection(
        {
          position: { horizontal: "center", vertical: "center" },
          boundingBox: smallBox,
        },
        0.9,
      ),
    );
    expect(straight.instruction.text).toBe("Geradeaus.");

    const reached = loop.processFrame(
      detection(
        {
          position: { horizontal: "center", vertical: "center" },
          boundingBox: largeBox,
        },
        0.91,
      ),
    );
    expect(reached.state).toBe("TARGET_REACHED");
    expect(reached.instruction.kind).toBe("reached");
    expect(reached.spoken).toContain("direkt vor dir");
  });

  it("does not report TARGET_LOST for a single missed frame", async () => {
    const { loop } = build(["Ich suche Hafermilch."]);
    await loop.requestProduct();
    loop.processFrame(detection({}, 0.9));
    loop.processFrame(detection({}, 0.9));
    const afterMiss = loop.processFrame(miss());
    expect(afterMiss.state).toBe("GUIDING");
  });

  it("searches again after sustained loss", async () => {
    const { loop } = build(["Ich suche Hafermilch."]);
    await loop.requestProduct();
    loop.processFrame(detection({}, 0.9));
    loop.processFrame(detection({}, 0.9));
    loop.processFrame(miss());
    loop.processFrame(miss());
    loop.processFrame(miss());
    const lost = loop.processFrame(miss());
    expect(lost.state).toBe("TARGET_LOST");
    const recovery = loop.processFrame(detection({}, 0.9));
    expect(recovery.state).toBe("TARGET_CANDIDATE");
  });

  it("never speaks a guarantee phrase and flags low confidence", async () => {
    const { loop, speechOutput } = build(["Hafermilch"]);
    await loop.requestProduct();
    const result = loop.processFrame(detection({}, 0.2));
    expect(containsGuaranteePhrase(speechOutput.lastText ?? "")).toBe(false);
    expect(result.downgraded).toBe(true);
  });

  it("returns to idle when no product is understood", async () => {
    const { loop } = build([null]);
    const product = await loop.requestProduct();
    expect(product).toBeNull();
    expect(loop.currentState).toBe("IDLE");
  });

  it("stop cancels speech and resets", async () => {
    const { loop, speechOutput } = build(["Hafermilch"]);
    await loop.requestProduct();
    loop.stop();
    expect(speechOutput.cancelCount).toBe(1);
    expect(loop.currentState).toBe("IDLE");
    expect(loop.currentTarget).toBeNull();
  });
});
