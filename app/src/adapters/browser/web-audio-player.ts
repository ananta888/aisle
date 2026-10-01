import type { AudioPlayer } from "../../ports/audio-player";

function audioContextConstructor(): (new () => AudioContext) | null {
  if (typeof window === "undefined") return null;
  const candidate = window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return candidate ?? null;
}

export class WebAudioPlayer implements AudioPlayer {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;

  async play(wav: ArrayBuffer): Promise<void> {
    const AudioCtx = audioContextConstructor();
    if (!AudioCtx) return;
    this.context ??= new AudioCtx();
    const buffer = await this.context.decodeAudioData(wav.slice(0));
    this.stop();
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.onended = () => {
      if (this.source === source) this.source = null;
    };
    source.start();
    this.source = source;
  }

  stop(): void {
    if (!this.source) return;
    try {
      this.source.stop();
    } catch {
      // already stopped
    }
    this.source = null;
  }
}
