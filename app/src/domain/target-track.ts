import type { Confidence } from "./confidence";
import type { BoundingBox, RelativePosition } from "./types";

export type TrackStatus = "searching" | "candidate" | "tracked" | "lost";

export interface TrackState {
  status: TrackStatus;
  confidence: Confidence;
  position?: RelativePosition;
  boundingBox?: BoundingBox;
  missedFrames: number;
}
