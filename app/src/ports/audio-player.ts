export interface AudioPlayer {
  play(wav: ArrayBuffer): Promise<void>;
  stop(): void;
}
