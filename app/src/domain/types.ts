export type Horizontal = "left" | "center" | "right";

export type Vertical = "up" | "center" | "down";

export interface RelativePosition {
  horizontal: Horizontal;
  vertical: Vertical;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Product {
  name: string;
  normalized: string;
}
