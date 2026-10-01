import { describe, expect, it } from "vitest";
import {
  reduceGuidanceState,
  type StateMachineInput,
} from "../src/application/guidance-state-machine";

const base: StateMachineInput = {
  tracking: "searching",
  targetReached: false,
  error: false,
  listening: false,
};

describe("guidance state machine", () => {
  it("follows the happy path", () => {
    let state = reduceGuidanceState("IDLE", { ...base, tracking: "searching" });
    expect(state).toBe("SEARCHING");
    state = reduceGuidanceState(state, { ...base, tracking: "candidate" });
    expect(state).toBe("TARGET_CANDIDATE");
    state = reduceGuidanceState(state, { ...base, tracking: "tracked" });
    expect(state).toBe("TARGET_TRACKED");
    state = reduceGuidanceState(state, { ...base, tracking: "tracked" });
    expect(state).toBe("GUIDING");
    state = reduceGuidanceState(state, {
      ...base,
      tracking: "tracked",
      targetReached: true,
    });
    expect(state).toBe("TARGET_REACHED");
  });

  it("recovers from loss back into searching", () => {
    let state = reduceGuidanceState("GUIDING", { ...base, tracking: "lost" });
    expect(state).toBe("TARGET_LOST");
    state = reduceGuidanceState(state, { ...base, tracking: "searching" });
    expect(state).toBe("SEARCHING");
  });

  it("prioritises error and reached over tracking", () => {
    expect(
      reduceGuidanceState("GUIDING", { ...base, error: true }),
    ).toBe("ERROR");
    expect(
      reduceGuidanceState("GUIDING", {
        ...base,
        tracking: "lost",
        targetReached: true,
      }),
    ).toBe("TARGET_REACHED");
  });

  it("enters listening while listening", () => {
    expect(
      reduceGuidanceState("SEARCHING", { ...base, listening: true }),
    ).toBe("LISTENING");
  });
});
