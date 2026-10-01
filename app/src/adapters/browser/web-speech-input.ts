import type { SpeechInput } from "../../ports/speech-input";

export interface WebSpeechInputOptions {
  lang?: string;
}

function getRecognizer(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export class WebSpeechInput implements SpeechInput {
  constructor(private readonly options: WebSpeechInputOptions = {}) {}

  isAvailable(): boolean {
    return getRecognizer() !== null;
  }

  listenOnce(): Promise<string | null> {
    const Recognizer = getRecognizer();
    if (!Recognizer) return Promise.resolve(null);

    return new Promise((resolve) => {
      const recognition = new Recognizer();
      recognition.lang = this.options.lang ?? "de-DE";
      recognition.continuous = false;
      recognition.interimResults = false;

      let settled = false;
      const finish = (value: string | null): void => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      recognition.onresult = (event) => {
        const alternative = event.results[0]?.[0];
        const transcript = alternative?.transcript?.trim();
        finish(transcript && transcript.length > 0 ? transcript : null);
      };
      recognition.onerror = () => finish(null);
      recognition.onend = () => finish(null);

      try {
        recognition.start();
      } catch {
        finish(null);
      }
    });
  }
}
