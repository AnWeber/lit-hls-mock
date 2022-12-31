import Hls from 'hls.js';
import { LitElement, html, } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("showcase-mediaplayer")
export class MediaPlayer extends LitElement {

  private hls = new Hls();

  @property()
  public set url(url: string) {
    if (url) {
      this.hls.loadSource(url);
    } else {
      this.hls.stopLoad();
    }
  }

	constructor() {
    super();
  }





  render() {
    setTimeout(() => {
      const rootNode = this.shadowRoot?.querySelector("audio");
      if (rootNode) {
        this.hls.attachMedia(rootNode);
        rootNode.play();
      }
    })
    return html`<audio></audio>`;
  }
}
