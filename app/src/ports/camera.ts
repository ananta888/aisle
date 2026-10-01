export interface CameraFrame {
  data: unknown;
  width: number;
  height: number;
  timestamp: number;
}

export interface CameraSource {
  start(): Promise<void>;
  grab(): Promise<CameraFrame | null>;
  stop(): void;
}
