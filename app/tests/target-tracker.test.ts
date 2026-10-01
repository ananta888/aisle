import { describe, expect, it } from "vitest";
import {
  TargetTracker,
  type TrackerPolicy,
} from "../src/application/target-tracker";
import { detection, miss } from "./support/factories";

const policy: TrackerPolicy = {
  missWindow: 3,
  minConfidence: 0.4,
  smoothing: 0.5,
};

describe("TargetTracker", () => {
  it("starts searching", () => {
    expect(new TargetTracker(policy).current.status).toBe("searching");
  });

  it("reports candidate on the first detection, tracked on the second", () => {
    const tracker = new TargetTracker(policy);
    expect(tracker.update(detection({}, 0.82)).status).toBe("candidate");
    expect(tracker.update(detection({}, 0.88)).status).toBe("tracked");
  });

  it("does not lose the target on a single missed frame", () => {
    const tracker = new TargetTracker(policy);
    tracker.update(detection({}, 0.9));
    tracker.update(detection({}, 0.9));
    const afterMiss = tracker.update(miss());
    expect(afterMiss.status).toBe("tracked");
    expect(afterMiss.missedFrames).toBe(1);
  });

  it("declares lost only after the miss window is exceeded", () => {
    const tracker = new TargetTracker(policy);
    tracker.update(detection({}, 0.9));
    tracker.update(detection({}, 0.9));
    tracker.update(miss());
    tracker.update(miss());
    tracker.update(miss());
    expect(tracker.update(miss()).status).toBe("lost");
  });

  it("treats low-confidence detections as misses", () => {
    const tracker = new TargetTracker(policy);
    tracker.update(detection({}, 0.9));
    tracker.update(detection({}, 0.9));
    const low = tracker.update(detection({}, 0.2));
    expect(low.status).toBe("tracked");
    expect(low.missedFrames).toBe(1);
  });

  it("resets back to searching", () => {
    const tracker = new TargetTracker(policy);
    tracker.update(detection({}, 0.9));
    tracker.reset();
    expect(tracker.current.status).toBe("searching");
  });
});
