export interface SpeechInput {
  isAvailable(): boolean;
  listenOnce(): Promise<string | null>;
}
