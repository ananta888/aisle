import { clampConfidence, type Observation } from "../domain/confidence";
import type { ProductCandidate } from "../domain/product-candidate";
import type { TrackState } from "../domain/target-track";

export interface TrackerPolicy {
  missWindow: number;
  minConfidence: number;
  smoothing: number;
}

export const DEFAULT_TRACKER_POLICY: TrackerPolicy = {
  missWindow: 3,
  minConfidence: 0.4,
  smoothing: 0.5,
};

const INITIAL_STATE: TrackState = {
  status: "searching",
  confidence: 0,
  missedFrames: 0,
};

export class TargetTracker {
  private state: TrackState = { ...INITIAL_STATE };
  private streak = 0;

  constructor(private readonly policy: TrackerPolicy = DEFAULT_TRACKER_POLICY) {}

  get current(): TrackState {
    return this.state;
  }

  reset(): void {
    this.state = { ...INITIAL_STATE };
    this.streak = 0;
  }

  update(observation: Observation<ProductCandidate>): TrackState {
    const candidate = observation.value;
    const detected =
      candidate.detected && observation.confidence >= this.policy.minConfidence;

    if (!detected) {
      const missedFrames = this.state.missedFrames + 1;
      const hadTrack =
        this.state.status === "candidate" || this.state.status === "tracked";

      if (!hadTrack || missedFrames > this.policy.missWindow) {
        this.streak = 0;
        this.state = {
          status: hadTrack ? "lost" : "searching",
          confidence: 0,
          missedFrames,
        };
        return this.state;
      }

      const decayed = clampConfidence(
        this.state.confidence * (1 - this.policy.smoothing),
      );
      this.state = { ...this.state, confidence: decayed, missedFrames };
      return this.state;
    }

    this.streak += 1;
    const hadTrack = this.streak > 1;
    const smoothedConfidence = hadTrack
      ? clampConfidence(
          this.policy.smoothing * observation.confidence +
            (1 - this.policy.smoothing) * this.state.confidence,
        )
      : observation.confidence;

    this.state = {
      status: this.streak >= 2 ? "tracked" : "candidate",
      confidence: smoothedConfidence,
      position: candidate.position,
      boundingBox: candidate.boundingBox,
      missedFrames: 0,
    };
    return this.state;
  }
}
