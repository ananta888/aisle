import type { SpeechOutput, SpeechPriority } from "../../ports/speech-output";

export interface WebSpeechOutputOptions {
  lang?: string;
}

export class WebSpeechOutput implements SpeechOutput {
  private lastText = "";

  constructor(private readonly options: WebSpeechOutputOptions = {}) {}

  speak(text: string, _priority: SpeechPriority): void {
    if (text === this.lastText) return;
    this.lastText = text;

    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.options.lang ?? "de-DE";
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    this.lastText = "";
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
