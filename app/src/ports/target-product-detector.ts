import type { Observation } from "../domain/confidence";
import type { ProductCandidate } from "../domain/product-candidate";
import type { TargetProduct } from "../domain/target-product";
import type { CameraFrame } from "./camera";

export interface DetectorRequest {
  frame: CameraFrame;
  target: TargetProduct;
}

export interface TargetProductDetector {
  detect(request: DetectorRequest): Promise<Observation<ProductCandidate>>;
}
