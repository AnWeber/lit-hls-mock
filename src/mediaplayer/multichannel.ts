/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("showcase-multichannel")
export class MultiChannel extends LitElement {
  private volumeNodeL: GainNode | undefined;
  private stereoPannerL: StereoPannerNode | undefined;
  private canvas: HTMLCanvasElement | undefined;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  constructor() {
    super();
  }

  public init(): void {
    const mediaElement = this.shadowRoot?.querySelector("audio");
    this.canvas = this.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    this.canvasCtx = this.canvas?.getContext("2d");

    if (mediaElement) {
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(mediaElement);
      const analyser = audioContext.createAnalyser();

      const splitterNode = new ChannelSplitterNode(audioContext);
      const mergerNode = new ChannelMergerNode(audioContext);

      audioSource.connect(splitterNode);

      this.volumeNodeL = new GainNode(audioContext);
      const volumeNodeR = new GainNode(audioContext);
      splitterNode.connect(this.volumeNodeL, 0); // connect OUTPUT channel 0
      splitterNode.connect(volumeNodeR, 0); // connect OUTPUT channel 0

      this.volumeNodeL.connect(mergerNode, 0, 0); // connect INPUT channel 0
     // volumeNodeR.connect(mergerNode, 0, 1); // connect INPUT channel 0

      volumeNodeR.connect(analyser);
      analyser.connect(mergerNode, 0, 1)

      this.stereoPannerL = new StereoPannerNode(audioContext);

      mergerNode.connect(this.stereoPannerL); // connect INPUT channel 0

      this.stereoPannerL.connect(audioContext.destination);


      this.draw(analyser);
    }
  }

  private draw(analyser: AnalyserNode) {
    requestAnimationFrame(() => this.draw(analyser));
    if (this.canvasCtx && this.canvas) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(dataArray);

      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawBar(
        this.canvasCtx,
        dataArray,
        this.canvas.width,
        this.canvas.height
      );
    }
  }

  drawBar(
    canvasCtx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) {
    const barWidth = (width / dataArray.length) * 5;
    let x = 0;
    for (let index = 0; index < dataArray.length;index++) {
      const barHeight = dataArray[index] / 2;

      // canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  drawMdn(
    canvasCtx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) {
    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, width, height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    const sliceWidth = (width * 1.0) / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();
  }

  _drawRawOsc(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) {
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = i * ((width * 1.0) / data.length); // need to fix x
      const v = data[i] / 128.0;
      const y = (v * height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  private setVolume(node: GainNode | undefined, value: unknown) {
    if (node) {
      console.info(value);
      node.gain.value = parseFloat(`${value}`) || 0;
    }
  }
  private setBalance(node: StereoPannerNode | undefined, value: unknown) {
    if (node) {
      console.info(value);
      node.pan.value = parseFloat(`${value}`) || 0;
    }
  }

  render() {
    return html`
      <div>
        <audio controls src="/multichannel.mp4"></audio>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          @change=${(e: any) =>
            this.setVolume(this.volumeNodeL, e.target.value)}
        />
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          @change=${(e: any) =>
            this.setBalance(this.stereoPannerL, e.target.value)}
        />
        <button @click=${this.init.bind(this)}>Init</button>
        <canvas></canvas>
      </div>
    `;
  }
}
