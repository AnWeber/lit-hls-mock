import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { Track } from '../models';

@customElement("showcase-app")
export class ShowcaseApp extends LitElement {
  constructor() {
    super();
	}

	private tracks: Array<Track> = [];

  render() {
		return html`<div>
			${this.tracks.map(
				(track) =>
					html`<showcase-mediaplayer url="${track.url}"></showcase-mediaplayer>`
			)}
			<hr/>
      <showcase-trackmanager @track-added="${this.trackAdded}"></showcase-trackmanager>
    </div>`;
	}

	private trackAdded(evt: CustomEvent<Track[]>) {
		this.tracks = evt.detail;
    this.requestUpdate();
	}
}
