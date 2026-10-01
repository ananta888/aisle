import type { Observation } from "../domain/confidence";
import type { ProductCandidate } from "../domain/product-candidate";
import type { TargetProduct } from "../domain/target-product";
import type { SpeechInput } from "../ports/speech-input";
import type { SpeechOutput, SpeechPriority } from "../ports/speech-output";
import {
  instructionFor,
  type GuidanceConfig,
  type GuidanceInstruction,
} from "./guidance-rules";
import {
  reduceGuidanceState,
  type GuidanceState,
} from "./guidance-state-machine";
import { parseProductRequest } from "./product-request";
import { SafetySupervisor } from "./safety-supervisor";
import { TargetTracker } from "./target-tracker";

export interface LoopDependencies {
  speechInput: SpeechInput;
  speechOutput: SpeechOutput;
  tracker?: TargetTracker;
  safety?: SafetySupervisor;
  guidanceConfig?: GuidanceConfig;
}

export interface GuidanceResult {
  state: GuidanceState;
  instruction: GuidanceInstruction;
  spoken: string;
  downgraded: boolean;
  reasons: string[];
}

export class MvpLoop {
  private state: GuidanceState = "IDLE";
  private target: TargetProduct | null = null;
  private readonly tracker: TargetTracker;
  private readonly safety: SafetySupervisor;
  private readonly guidanceConfig?: GuidanceConfig;

  constructor(private readonly deps: LoopDependencies) {
    this.tracker = deps.tracker ?? new TargetTracker();
    this.safety = deps.safety ?? new SafetySupervisor();
    this.guidanceConfig = deps.guidanceConfig;
  }

  get currentState(): GuidanceState {
    return this.state;
  }

  get currentTarget(): TargetProduct | null {
    return this.target;
  }

  async requestProduct(): Promise<TargetProduct | null> {
    this.state = "LISTENING";
    const text = await this.deps.speechInput.listenOnce();
    const product = parseProductRequest(text);
    if (!product) {
      this.state = "IDLE";
      return null;
    }
    this.target = product;
    this.tracker.reset();
    this.state = "SEARCHING";
    this.deps.speechOutput.speak(`Ich suche nach ${product.name}.`, "info");
    return product;
  }

  processFrame(observation: Observation<ProductCandidate>): GuidanceResult {
    const track = this.tracker.update(observation);
    const instruction = instructionFor(track, this.guidanceConfig);
    const targetReached = instruction.kind === "reached";

    this.state = reduceGuidanceState(this.state, {
      tracking: track.status,
      targetReached,
      error: false,
      listening: false,
    });

    const review = this.safety.review(instruction.text, track.confidence);
    const priority: SpeechPriority =
      instruction.kind === "reached" ? "warning" : "info";
    this.deps.speechOutput.speak(review.text, priority);

    return {
      state: this.state,
      instruction,
      spoken: review.text,
      downgraded: review.downgraded,
      reasons: review.reasons,
    };
  }

  stop(): void {
    this.deps.speechOutput.cancel();
    this.tracker.reset();
    this.state = "IDLE";
    this.target = null;
  }
}
