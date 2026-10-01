import { describe, expect, it } from "vitest";
import { WhisperDecisionClient } from "../src/adapters/whisper/whisper-decision-client";

const url = process.env.AISLE_WHISPER_URL;
const audioB64 = process.env.AISLE_WHISPER_AUDIO_B64;

const live = url !== undefined && audioB64 !== undefined;

describe.skipIf(!live)("Whisper decision live server", () => {
  it("returns a typed decision and/or a fallback transcript", async () => {
    const client = new WhisperDecisionClient({ baseUrl: url!, timeoutMs: 60000 });
    const obs = await client.recognize(audioB64!);
    expect(obs.source).toBe("whisper-decision");
    expect(typeof obs.value.intentStatus).toBe("string");
    expect(obs.value.intent === null || typeof obs.value.intent === "string").toBe(true);
  });
});
