import { describe, expect, it } from "vitest";
import { DragonVoiceClient } from "../src/adapters/dragon/dragon-voice-client";

const url = process.env.AISLE_TTS_URL;
const token = process.env.AISLE_TTS_TOKEN;

const live = url !== undefined && token !== undefined;

describe.skipIf(!live)("Dragon voice live runtime", () => {
  it("returns a non-empty RIFF/WAV clip", async () => {
    const client = new DragonVoiceClient({ baseUrl: url!, token: token!, timeoutMs: 30000 });
    const wav = await client.speak("Etwas nach rechts.");
    expect(wav).not.toBeNull();
    expect(wav!.byteLength).toBeGreaterThan(1000);
    const magic = String.fromCharCode(...new Uint8Array(wav!.slice(0, 4)));
    expect(magic).toBe("RIFF");
  });
});
