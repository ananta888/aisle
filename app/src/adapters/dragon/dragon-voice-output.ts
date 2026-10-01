import type { AudioPlayer } from "../../ports/audio-player";
import type { SpeechOutput, SpeechPriority } from "../../ports/speech-output";
import type { DragonVoiceClient } from "./dragon-voice-client";

export interface DragonVoiceOutputDeps {
  client: DragonVoiceClient;
  player: AudioPlayer;
  onError?: (error: unknown) => void;
}

export class DragonVoiceOutput implements SpeechOutput {
  private lastText = "";

  constructor(private readonly deps: DragonVoiceOutputDeps) {}

  speak(text: string, _priority: SpeechPriority): void {
    if (text === this.lastText) return;
    this.lastText = text;
    void this.play(text);
  }

  cancel(): void {
    this.lastText = "";
    this.deps.player.stop();
  }

  private async play(text: string): Promise<void> {
    try {
      const wav = await this.deps.client.speak(text);
      if (!wav) return;
      if (this.lastText !== text) return;
      await this.deps.player.play(wav);
    } catch (error) {
      this.deps.onError?.(error);
    }
  }
}
