import type { Confidence } from "./confidence";
import type { BoundingBox, Horizontal, RelativePosition, Vertical } from "./types";

export interface ProductCandidate {
  target: string;
  detected: boolean;
  confidence: Confidence;
  position: RelativePosition;
  boundingBox: BoundingBox;
}

const LEFT_MAX = 0.4;
const RIGHT_MIN = 0.6;
const UP_MAX = 0.4;
const DOWN_MIN = 0.6;

export function horizontalFromCenterX(centerX: number): Horizontal {
  if (centerX < LEFT_MAX) return "left";
  if (centerX > RIGHT_MIN) return "right";
  return "center";
}

export function verticalFromCenterY(centerY: number): Vertical {
  if (centerY < UP_MAX) return "up";
  if (centerY > DOWN_MIN) return "down";
  return "center";
}

export function positionFromBox(box: BoundingBox): RelativePosition {
  return {
    horizontal: horizontalFromCenterX(box.x + box.width / 2),
    vertical: verticalFromCenterY(box.y + box.height / 2),
  };
}

export function boxCenter(box: BoundingBox): { x: number; y: number } {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export function sizeProxy(box: BoundingBox): number {
  return box.height;
}
