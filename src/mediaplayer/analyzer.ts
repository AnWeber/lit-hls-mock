/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("showcase-analyser")
export class Analysers extends LitElement {
  private stereoPanner: StereoPannerNode | undefined;
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



      this.stereoPanner = new StereoPannerNode(audioContext);
      audioSource.connect(this.stereoPanner);
      const splitterNode = new ChannelSplitterNode(audioContext);
      const mergerNode = new ChannelMergerNode(audioContext);
      this.stereoPanner.connect(splitterNode);
      const analysers: Array<AnalyserNode> = [];
      for (let index = 0; index < 2; index++){

        const analyser = audioContext.createAnalyser();
        splitterNode.connect(analyser, index, 0); // connect INPUT channel 0

        analyser.connect(mergerNode, 0, index);
        analysers.push(analyser)
      }

      mergerNode.connect(audioContext.destination)

      this.draw(analysers);
    }
  }

  private draw(analysers: Array<AnalyserNode>) {
    setTimeout(() => {

      requestAnimationFrame(() => this.draw(analysers));
    }, 50);
    if (this.canvasCtx && this.canvas) {
      let index = 0;
      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const analyser of analysers) {
        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatTimeDomainData(dataArray);

        this.drawBar(
          this.canvasCtx,
          dataArray,
          this.canvas.width,
          this.canvas.height,
          index++
        );
      }
    }
  }

  drawTimeDomainData(
    canvasCtx: CanvasRenderingContext2D,
    dataArray: Float32Array,
    width: number,
    height: number,
    index: number
  ) {
    canvasCtx.lineWidth = 5;
    if (index === 0) {
      canvasCtx.strokeStyle = "rgb(0, 102, 204)";
    } else {
      canvasCtx.strokeStyle = "rgb(204, 0, 102)";

    }
  canvasCtx.beginPath();

  const sliceWidth = (width * 1.0) / dataArray.length;
    let x = 0;

    const halfHeight = height / 2;

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] * 100.0;
      const y = halfHeight + v;
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

  drawBar(
    canvasCtx: CanvasRenderingContext2D,
    dataArray: Float32Array,
    width: number,
    height: number,
    index: number
  ) {

    if (index === 0) {
      canvasCtx.fillStyle = "rgb(0, 102, 204)";
    } else {
      canvasCtx.fillStyle = "rgb(204, 0, 102)";

    }
    const barWidth = (width / dataArray.length) * 5;
    let posX = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] ) * 1000;

      canvasCtx.fillRect(
        posX,
        height - Math.min(height, barHeight / 2),
        barWidth,
        barHeight / 2
      );
      posX += barWidth + 1;
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
          min="-1"
          max="1"
          step="0.01"
          @change=${(e: any) =>
            this.setBalance(this.stereoPanner, e.target.value)}
        />
        <button @click=${this.init.bind(this)}>Init</button>
        <canvas></canvas>
      </div>
    `;
  }
}
