import { describe, expect, it } from "vitest";
import { instructionFor } from "../src/application/guidance-rules";
import type { TrackState } from "../src/domain/target-track";

function track(overrides: Partial<TrackState>): TrackState {
  return {
    status: "tracked",
    confidence: 0.9,
    missedFrames: 0,
    ...overrides,
  };
}

describe("guidance rules", () => {
  it("prompts camera search when nothing is visible", () => {
    const result = instructionFor(track({ status: "searching" }));
    expect(result.kind).toBe("search");
    expect(result.text).toContain("noch nicht erkennen");
  });

  it("guides the camera left/right when searching with a last direction", () => {
    expect(
      instructionFor(
        track({
          status: "searching",
          position: { horizontal: "left", vertical: "center" },
        }),
      ).text,
    ).toContain("nach links");
    expect(
      instructionFor(
        track({
          status: "searching",
          position: { horizontal: "right", vertical: "center" },
        }),
      ).text,
    ).toContain("nach rechts");
  });

  it("moves left/right when the target is off-centre", () => {
    expect(
      instructionFor(
        track({ position: { horizontal: "right", vertical: "center" } }),
      ),
    ).toMatchObject({ text: "Etwas nach rechts.", kind: "move" });
    expect(
      instructionFor(
        track({ position: { horizontal: "left", vertical: "center" } }),
      ),
    ).toMatchObject({ text: "Etwas nach links.", kind: "move" });
  });

  it("pans up/down before horizontal correction", () => {
    expect(
      instructionFor(
        track({ position: { horizontal: "center", vertical: "up" } }),
      ),
    ).toMatchObject({ kind: "move" });
    expect(
      instructionFor(
        track({ position: { horizontal: "center", vertical: "down" } }),
      ).text,
    ).toContain("nach unten");
  });

  it("says straight ahead when centred but small", () => {
    expect(
      instructionFor(
        track({
          position: { horizontal: "center", vertical: "center" },
          boundingBox: { x: 0.45, y: 0.45, width: 0.1, height: 0.1 },
        }),
      ),
    ).toMatchObject({ text: "Geradeaus.", kind: "forward" });
  });

  it("announces the target when centred and sufficiently large", () => {
    expect(
      instructionFor(
        track({
          position: { horizontal: "center", vertical: "center" },
          boundingBox: { x: 0.4, y: 0.2, width: 0.3, height: 0.6 },
        }),
      ),
    ).toMatchObject({ kind: "reached" });
  });
});
