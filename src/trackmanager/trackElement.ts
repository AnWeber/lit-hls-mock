import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("showcase-trackcontrols")
export class TrackElement extends LitElement {
  @property()
  public id = "";
  @property()
  public url = "";

  constructor() {
    super();
  }

  static get styles() {
    return css`
      .trackcontrols {
        display: flex;
        flex-wrap: none;
      }
    `;
  }
  render() {
    return html`<div class="trackcontrols">
      <span>${this.id} - ${this.url}</span>
      <button @click="${this._stop}">Stop</button>
    </div>`;
  }

  async _stop() {
    const response = await fetch(`${this.id}/stream/close`);
    console.info(response);
  }
}
