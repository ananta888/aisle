import type { Observation } from "../../domain/confidence";
import type { ProductCandidate } from "../../domain/product-candidate";
import type {
  DetectorRequest,
  TargetProductDetector,
} from "../../ports/target-product-detector";

export class ScriptedTargetProductDetector implements TargetProductDetector {
  private index = 0;

  constructor(
    private readonly script: ReadonlyArray<Observation<ProductCandidate>>,
  ) {}

  async detect(_request: DetectorRequest): Promise<Observation<ProductCandidate>> {
    if (this.script.length === 0) {
      throw new Error("ScriptedTargetProductDetector: empty script");
    }
    const index = Math.min(this.index, this.script.length - 1);
    this.index += 1;
    return this.script[index]!;
  }
}
