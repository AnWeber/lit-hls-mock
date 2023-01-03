import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { Track } from "../models";

@customElement("showcase-trackmanager")
export class TrackManager extends LitElement {

  @property()
  public tracks: Track[] = [];

  @query(`select[name="trackSelection"]`)
  private trackSelection: HTMLSelectElement | undefined;

  @query(`input[name="vod"]`)
  private chkVod: HTMLInputElement | undefined;

  @query(`input[name="hlsError"]`)
  private chkErrorInHls: HTMLInputElement | undefined;

  private trackOptions = [
    {
      title: "test",
      tracks: ["test/test.m3u8"],
    },
    {
      title: "HLS Timeout",
      tracks: ["test/test.m3u8", "test/test.m3u8?timeout=true"],
    },
    {
      title: "HLS Error",
      tracks: ["test/test.m3u8", "test/test.m3u8?hlserror=true"],
    }
  ];

  static get styles() {
    return css`
      svg {
        height: 1.25em;
        width: 1.25em;
      }
    `;
  }

  constructor() {
    super();
  }

  index = 0;
  render() {
    const result = html` <div>
      <div>
        <select name="trackSelection">
          ${this.trackOptions.map(
            (opt) => html`<option value="${opt.title}">${opt.title}</option>`
          )}
        </select>
        <button @click="${this.add}"><svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 48 48"><path d="M22.5 38V25.5H10v-3h12.5V10h3v12.5H38v3H25.5V38Z"/></svg></button>
        <input type="checkbox" name="vod">VOD</input>
      </div>
      ${this.tracks.map(
        (track) =>
          html`<showcase-trackcontrols
            id="${track.id}"
            url="${track.url}"
            vod="${track.vod}"
          ></showcase-trackcontrols>`
      )}
    </div>`;
    return result;
  }

  private add() {
    if (this.trackSelection?.value) {
      const title = this.trackSelection.value;
      const trackOption = this.trackOptions.find((opt) => opt.title === title);
      if (trackOption) {
        let index = 0;
        for (const track of trackOption.tracks) {
          const id = `${index++}_${Date.now()}`;
          const vod = this.chkVod?.checked ? true : undefined;
          let url = track;
          if (!trackOption.noProxy) {
            const query = {
              vod,
              hlserror: this.chkErrorInHls?.checked ? "true" : undefined,
            };
            url = `/local/${id}/${track}${this.toQuery(query)}`;
          }
          this.tracks.push({
            id,
            url,
            vod
          });
        }
        this.refreshTracks();
      }
    }
  }
  private refreshTracks() {
    const tracksChanged = new CustomEvent("tracks-changed", {
      detail: this.tracks,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(tracksChanged);
    this.requestUpdate();
  }

  private toQuery(query: Record<string, string | boolean | undefined>) {
    if (query) {
      const queryString = Object.entries(query)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}=${value}`);
      if (queryString.length > 0) {
        return `?${queryString}`;
      }
    }
    return "";
  }
}
