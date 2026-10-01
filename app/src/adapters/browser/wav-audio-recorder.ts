import type { AudioClip, AudioRecorder } from "../../ports/audio-recorder";

export interface WavAudioRecorderOptions {
  maxDurationMs?: number;
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }
  return new Uint8Array(buffer);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function audioContextConstructor(): (new () => AudioContext) | null {
  if (typeof window === "undefined") return null;
  const candidate = window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return candidate ?? null;
}

export class WavAudioRecorder implements AudioRecorder {
  constructor(private readonly options: WavAudioRecorderOptions = {}) {}

  isAvailable(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      audioContextConstructor() !== null
    );
  }

  async recordOnce(): Promise<AudioClip | null> {
    const AudioCtx = audioContextConstructor();
    if (!AudioCtx) return null;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioCtx();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const sink = context.createGain();
    sink.gain.value = 0;

    const chunks: Float32Array[] = [];
    processor.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    source.connect(processor);
    processor.connect(sink);
    sink.connect(context.destination);

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, this.options.maxDurationMs ?? 6000);
      });
    } finally {
      processor.disconnect();
      source.disconnect();
      sink.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      await context.close();
    }

    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (total === 0) return null;
    const samples = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }

    return {
      base64: toBase64(encodeWav(samples, context.sampleRate)),
      mimeType: "audio/wav",
      durationMs: Math.round((samples.length / context.sampleRate) * 1000),
    };
  }
}
