import Hls from 'hls.js';
import { LitElement, html, } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("showcase-mediaplayer")
export class MediaPlayer extends LitElement {

  private hls: Hls;

  constructor() {
    super();
    this.hls = new Hls();

    this.hls.on(Hls.Events.ERROR, (evt, data) => {
      console.info(evt, data);
    })
  }

  @property()
  public set url(url: string) {
    if (url) {
      this.hls.loadSource(url);
    } else {
      this.hls.stopLoad();
    }
  }

  render() {
    setTimeout(() => {
      const rootNode = this.shadowRoot?.querySelector("audio");
      if (rootNode) {
        this.hls.attachMedia(rootNode);
        rootNode.play();

        rootNode.addEventListener("error", (evt) => {
          console.error(evt);
        });
      }
    })
    return html`<audio controls></audio>`;
  }
}
