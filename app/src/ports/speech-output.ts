export type SpeechPriority = "info" | "warning" | "critical";

export interface SpeechOutput {
  speak(text: string, priority: SpeechPriority): void;
  cancel(): void;
}
