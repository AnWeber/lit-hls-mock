/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("showcase-multichannel")
export class MultiChannel extends LitElement {

  private volumeNodeL: GainNode | undefined;
  private stereoPannerL: StereoPannerNode | undefined;
  constructor() {
    super();
  }


  public init(): void {
    const mediaElement = this.shadowRoot?.querySelector("audio");
    if (mediaElement) {


        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaElementSource(mediaElement);


        const splitterNode = new ChannelSplitterNode(audioContext);
        const mergerNode = new ChannelMergerNode(audioContext);

        audioSource.connect(splitterNode);

        this.volumeNodeL = new GainNode(audioContext)
        const volumeNodeR = new GainNode(audioContext)
        splitterNode.connect(this.volumeNodeL, 0); // connect OUTPUT channel 0
        splitterNode.connect(volumeNodeR, 0); // connect OUTPUT channel 0



        this.volumeNodeL.connect(mergerNode, 0, 0); // connect INPUT channel 0
        volumeNodeR.connect(mergerNode, 0, 1); // connect INPUT channel 0



        this.stereoPannerL = new StereoPannerNode(audioContext)

        mergerNode.connect(this.stereoPannerL); // connect INPUT channel 0



      this.stereoPannerL.connect(audioContext.destination);

      }
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
      <input type="range" min="0" max="1" step="0.01" @change=${(e: any) => this.setVolume(this.volumeNodeL, e.target.value)}>
      <input type="range" min="-1" max="1" step="0.01" @change=${(e: any) => this.setBalance(this.stereoPannerL, e.target.value)}>
      <button @click=${this.init.bind(this)}>Init</button>
    </div>
    `;
  }
}
