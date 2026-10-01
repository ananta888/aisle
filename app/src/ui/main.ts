import { BrowserCameraSource } from "../adapters/browser/browser-camera";
import { WavAudioRecorder } from "../adapters/browser/wav-audio-recorder";
import { WebAudioPlayer } from "../adapters/browser/web-audio-player";
import { WebSpeechInput } from "../adapters/browser/web-speech-input";
import { WebSpeechOutput } from "../adapters/browser/web-speech-output";
import { DragonVoiceClient } from "../adapters/dragon/dragon-voice-client";
import { DragonVoiceOutput } from "../adapters/dragon/dragon-voice-output";
import { JevVisionDecisionDetector } from "../adapters/jev/jev-vision-decision-detector";
import { WhisperDecisionClient } from "../adapters/whisper/whisper-decision-client";
import { WhisperDecisionSpeechInput } from "../adapters/whisper/whisper-decision-speech-input";
import { MvpLoop } from "../application/orchestrator";
import type { SpeechInput } from "../ports/speech-input";
import type { SpeechOutput } from "../ports/speech-output";

const SAMPLE_INTERVAL_MS = 700;

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

function main(): void {
  const startButton = requireElement<HTMLButtonElement>("start");
  const stopButton = requireElement<HTMLButtonElement>("stop");
  const status = requireElement<HTMLDivElement>("status");
  const target = requireElement<HTMLParagraphElement>("target");

  const decisionEndpoint =
    document.querySelector<HTMLMetaElement>('meta[name="aisle-decision-endpoint"]')
      ?.content ?? "http://127.0.0.1:18150";

  const whisperEndpoint =
    document.querySelector<HTMLMetaElement>('meta[name="aisle-whisper-endpoint"]')
      ?.content?.trim() ?? "";

  const speechInput: SpeechInput =
    whisperEndpoint.length > 0
      ? new WhisperDecisionSpeechInput({
          recorder: new WavAudioRecorder({ maxDurationMs: 6000 }),
          client: new WhisperDecisionClient({
            baseUrl: whisperEndpoint,
            language: "de",
            timeoutMs: 30000,
          }),
        })
      : new WebSpeechInput({ lang: "de-DE" });
  const ttsEndpoint =
    document.querySelector<HTMLMetaElement>('meta[name="aisle-tts-endpoint"]')
      ?.content?.trim() ?? "";
  const ttsToken =
    document.querySelector<HTMLMetaElement>('meta[name="aisle-tts-token"]')
      ?.content?.trim() ?? "";

  const speechOutput: SpeechOutput =
    ttsEndpoint.length > 0
      ? new DragonVoiceOutput({
          client: new DragonVoiceClient({
            baseUrl: ttsEndpoint,
            token: ttsToken,
            timeoutMs: 15000,
          }),
          player: new WebAudioPlayer(),
        })
      : new WebSpeechOutput({ lang: "de-DE" });
  const camera = new BrowserCameraSource();
  const detector = new JevVisionDecisionDetector({
    baseUrl: decisionEndpoint,
    timeoutMs: 60000,
  });
  const loop = new MvpLoop({ speechInput, speechOutput });

  let running = false;
  const setStatus = (text: string): void => {
    status.textContent = text;
  };

  const sample = async (): Promise<void> => {
    if (!running) return;
    const currentTarget = loop.currentTarget;
    if (currentTarget) {
      try {
        const frame = await camera.grab();
        if (frame) {
          const observation = await detector.detect({
            frame,
            target: currentTarget,
          });
          setStatus(loop.processFrame(observation).spoken);
        }
      } catch {
        setStatus("Ich hatte ein Problem mit der Kamera.");
      }
    }
    window.setTimeout(() => {
      void sample();
    }, SAMPLE_INTERVAL_MS);
  };

  const stop = (): void => {
    running = false;
    camera.stop();
    loop.stop();
    setStatus("Gestoppt.");
  };

  const startListening = async (): Promise<void> => {
    stop();
    setStatus("Ich höre zu. Bitte nennen Sie ein Produkt.");
    if (!speechInput.isAvailable()) {
      setStatus("Spracheingabe wird von diesem Browser nicht unterstützt.");
      return;
    }
    const product = await loop.requestProduct();
    if (!product) {
      setStatus("Ich habe kein Produkt verstanden.");
      return;
    }
    target.textContent = `Zielprodukt: ${product.name}`;
    try {
      await camera.start();
    } catch {
      setStatus("Ich kann nicht auf die Kamera zugreifen.");
      return;
    }
    running = true;
    void sample();
  };

  startButton.addEventListener("click", () => {
    void startListening();
  });
  stopButton.addEventListener("click", stop);
}

main();
