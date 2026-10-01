export interface AudioClip {
  base64: string;
  mimeType: string;
  durationMs: number;
}

export interface AudioRecorder {
  isAvailable(): boolean;
  recordOnce(): Promise<AudioClip | null>;
}
