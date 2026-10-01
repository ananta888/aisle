import type { CameraFrame, CameraSource } from "../../ports/camera";

export class BrowserCameraSource implements CameraSource {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;

  async start(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Camera API is not available in this environment.");
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    const video = document.createElement("video");
    video.setAttribute("playsinline", "true");
    video.muted = true;
    video.srcObject = this.stream;
    await video.play();
    this.video = video;
    this.canvas = document.createElement("canvas");
  }

  async grab(): Promise<CameraFrame | null> {
    if (!this.video || !this.canvas) return null;
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (width === 0 || height === 0) return null;

    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(this.video, 0, 0, width, height);

    return {
      data: this.canvas.toDataURL("image/jpeg", 0.7),
      width,
      height,
      timestamp: Date.now(),
    };
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.canvas = null;
  }
}
