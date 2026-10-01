import { describe, expect, it } from "vitest";
import { DragonVoiceClient } from "../src/adapters/dragon/dragon-voice-client";
import { DragonVoiceOutput } from "../src/adapters/dragon/dragon-voice-output";
import type { AudioPlayer } from "../src/ports/audio-player";

const wav = new ArrayBuffer(8);

function clientReturning(body: unknown, ok = true): DragonVoiceClient {
  const fetcher = (async () => ({
    ok,
    arrayBuffer: async () => body,
  })) as unknown as typeof fetch;
  return new DragonVoiceClient({ baseUrl: "http://tts", token: "secret", fetcher });
}

class RecordingPlayer implements AudioPlayer {
  played: ArrayBuffer[] = [];
  stops = 0;
  async play(buffer: ArrayBuffer): Promise<void> {
    this.played.push(buffer);
  }
  stop(): void {
    this.stops += 1;
  }
}

const flush = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("DragonVoiceClient", () => {
  it("posts text to /speak with a bearer token", async () => {
    let url = "";
    let init: RequestInit | undefined;
    const fetcher = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      return { ok: true, arrayBuffer: async () => wav };
    }) as unknown as typeof fetch;

    const client = new DragonVoiceClient({
      baseUrl: "http://tts/",
      token: "secret",
      fetcher,
    });
    const result = await client.speak("  Etwas nach rechts.  ");
    expect(url).toBe("http://tts/speak");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer secret");
    expect(JSON.parse(init?.body as string)).toEqual({ text: "Etwas nach rechts." });
    expect(result).toBe(wav);
  });

  it("returns null on error responses, exceptions and empty text", async () => {
    expect(await clientReturning({}, false).speak("hi")).toBeNull();
    const throwing = new DragonVoiceClient({
      baseUrl: "http://tts",
      token: "t",
      fetcher: (async () => {
        throw new Error("offline");
      }) as unknown as typeof fetch,
    });
    expect(await throwing.speak("hi")).toBeNull();
    expect(await clientReturning(wav).speak("   ")).toBeNull();
  });
});

describe("DragonVoiceOutput", () => {
  it("plays synthesized audio", async () => {
    const player = new RecordingPlayer();
    const output = new DragonVoiceOutput({ client: clientReturning(wav), player });
    output.speak("Geradeaus.", "info");
    await flush();
    expect(player.played).toHaveLength(1);
  });

  it("does not repeat identical consecutive text", async () => {
    const player = new RecordingPlayer();
    const output = new DragonVoiceOutput({ client: clientReturning(wav), player });
    output.speak("Geradeaus.", "info");
    output.speak("Geradeaus.", "info");
    await flush();
    expect(player.played).toHaveLength(1);
  });

  it("stops playback and resets on cancel", () => {
    const player = new RecordingPlayer();
    const output = new DragonVoiceOutput({ client: clientReturning(wav), player });
    output.speak("Geradeaus.", "info");
    output.cancel();
    expect(player.stops).toBe(1);
  });

  it("drops stale audio and reports errors without throwing", async () => {
    const player = new RecordingPlayer();
    const first = deferred<ArrayBuffer | null>();
    const client = {
      source: "dragon-voice",
      speak: (text: string) =>
        text === "A" ? first.promise : Promise.resolve(new ArrayBuffer(4)),
    } as unknown as DragonVoiceClient;
    const errors: unknown[] = [];

    const output = new DragonVoiceOutput({
      client,
      player,
      onError: (error) => errors.push(error),
    });
    output.speak("A", "info");
    output.speak("B", "info");
    first.resolve(new ArrayBuffer(2));
    await flush();
    expect(player.played.every((buffer) => buffer.byteLength === 4)).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
