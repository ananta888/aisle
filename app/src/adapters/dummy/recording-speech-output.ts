import type { SpeechOutput, SpeechPriority } from "../../ports/speech-output";

export interface SpokenUtterance {
  text: string;
  priority: SpeechPriority;
}

export class RecordingSpeechOutput implements SpeechOutput {
  readonly spoken: SpokenUtterance[] = [];
  cancelCount = 0;

  speak(text: string, priority: SpeechPriority): void {
    this.spoken.push({ text, priority });
  }

  cancel(): void {
    this.cancelCount += 1;
  }

  get lastText(): string | null {
    return this.spoken.length > 0
      ? this.spoken[this.spoken.length - 1]!.text
      : null;
  }
}
