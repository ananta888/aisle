import type { SpeechInput } from "../../ports/speech-input";

export class ScriptedSpeechInput implements SpeechInput {
  private index = 0;

  constructor(private readonly utterances: ReadonlyArray<string | null>) {}

  isAvailable(): boolean {
    return true;
  }

  async listenOnce(): Promise<string | null> {
    if (this.index >= this.utterances.length) return null;
    const utterance = this.utterances[this.index] ?? null;
    this.index += 1;
    return utterance;
  }
}
