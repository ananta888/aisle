import { describe, expect, it } from "vitest";
import {
  horizontalFromCenterX,
  positionFromBox,
  verticalFromCenterY,
} from "../src/domain/product-candidate";

describe("product candidate position", () => {
  it("maps horizontal center-x to left/center/right", () => {
    expect(horizontalFromCenterX(0.2)).toBe("left");
    expect(horizontalFromCenterX(0.5)).toBe("center");
    expect(horizontalFromCenterX(0.8)).toBe("right");
  });

  it("maps vertical center-y to up/center/down", () => {
    expect(verticalFromCenterY(0.2)).toBe("up");
    expect(verticalFromCenterY(0.5)).toBe("center");
    expect(verticalFromCenterY(0.8)).toBe("down");
  });

  it("derives a relative position from a bounding box", () => {
    expect(
      positionFromBox({ x: 0.7, y: 0.4, width: 0.2, height: 0.2 }),
    ).toEqual({ horizontal: "right", vertical: "center" });
  });
});
