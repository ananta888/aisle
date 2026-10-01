import type { TrackStatus } from "../domain/target-track";

export type GuidanceState =
  | "IDLE"
  | "LISTENING"
  | "SEARCHING"
  | "TARGET_CANDIDATE"
  | "TARGET_TRACKED"
  | "GUIDING"
  | "TARGET_LOST"
  | "TARGET_REACHED"
  | "ERROR";

export interface StateMachineInput {
  tracking: TrackStatus;
  targetReached: boolean;
  error: boolean;
  listening: boolean;
}

export function reduceGuidanceState(
  current: GuidanceState,
  input: StateMachineInput,
): GuidanceState {
  if (input.error) return "ERROR";
  if (input.targetReached) return "TARGET_REACHED";
  if (input.listening) return "LISTENING";

  switch (input.tracking) {
    case "searching":
      return "SEARCHING";
    case "candidate":
      return "TARGET_CANDIDATE";
    case "tracked":
      return current === "TARGET_CANDIDATE" ? "TARGET_TRACKED" : "GUIDING";
    case "lost":
      return "TARGET_LOST";
    default:
      return current;
  }
}
