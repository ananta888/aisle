export interface DragonVoiceConfig {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  source?: string;
}

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_TEXT_LENGTH = 280;

export class DragonVoiceClient {
  readonly source: string;

  constructor(private readonly config: DragonVoiceConfig) {
    this.source = config.source ?? "dragon-voice";
  }

  async speak(text: string): Promise<ArrayBuffer | null> {
    const trimmed = text.trim();
    if (trimmed.length === 0) return null;

    const fetcher = this.config.fetcher ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    const url = `${this.config.baseUrl.replace(/\/+$/, "")}/speak`;

    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({ text: trimmed.slice(0, MAX_TEXT_LENGTH) }),
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return await response.arrayBuffer();
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
