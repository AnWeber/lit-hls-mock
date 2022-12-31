import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { Track } from "../models";

@customElement("showcase-trackmanager")
export class TrackManager extends LitElement {
  public tracks: Track[] = [];

  baseUrl="/daserste/de/master_audio1_128.m3u8"

  constructor() {
    super();
  }

  render() {
    return html` <div>
      <div>
        <button @click="${this.add}">New Track</button>
      </div>
      ${this.tracks.map(
        (track) =>
          html`<showcase-trackcontrols id="${track.id}" url="${track.url}"></showcase-trackcontrols>`
      )}
    </div>`;
  }

  private add() {
    const id = `track_${this.tracks.length}`;
    this.tracks.push({
      id,
      url: `${id}/stream${this.baseUrl}`,
    });
    const trackAdded = new CustomEvent("track-added", {
      detail: this.tracks,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(trackAdded);
    this.requestUpdate();
  }
}
