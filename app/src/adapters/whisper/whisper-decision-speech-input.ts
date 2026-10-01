import type { AudioRecorder } from "../../ports/audio-recorder";
import type { SpeechInput } from "../../ports/speech-input";
import {
  WhisperDecisionClient,
  type WhisperDecisionResult,
} from "./whisper-decision-client";

export interface WhisperDecisionSpeechInputDeps {
  recorder: AudioRecorder;
  client: WhisperDecisionClient;
}

export class WhisperDecisionSpeechInput implements SpeechInput {
  private last: WhisperDecisionResult | null = null;

  constructor(private readonly deps: WhisperDecisionSpeechInputDeps) {}

  get lastResult(): WhisperDecisionResult | null {
    return this.last;
  }

  isAvailable(): boolean {
    return this.deps.recorder.isAvailable();
  }

  async listenOnce(): Promise<string | null> {
    const clip = await this.deps.recorder.recordOnce();
    if (!clip) return null;

    const observation = await this.deps.client.recognize(clip.base64);
    this.last = observation.value;
    const result = observation.value;

    if (result.product) return result.product;
    if (result.intent === "cancel" || result.intent === "stop" || result.intent === "repeat") {
      return null;
    }
    return result.transcript;
  }
}
