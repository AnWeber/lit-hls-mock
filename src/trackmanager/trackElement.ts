import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("showcase-trackcontrols")
export class TrackElement extends LitElement {
  @property()
  public id = "";
  @property()
  public vod = "false";
  @property()
  public url = "";

  constructor() {
    super();
  }

  static get styles() {
    return css`
      svg {
        height: 1.25em;
        width: 1.25em;
      }
    `;
  }
  render() {
    const buttons = [];
    const actionFactory = (action: string) => async () => {
      const response = await fetch(`/local/${this.id}/action?${action}=true`);
      console.info(response);
    };
    if (!this.vod) {
      buttons.push(html`
        <button @click="${actionFactory("stop")}" title="Add #EXT-X-ENDLIST">
          <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 48 48">
            <path d="M15 15v18Zm-3 21V12h24v24Zm3-3h18V15H15Z" />
          </svg>
        </button>
      `);
    }
    return html`<div class="trackcontrols">
      <span title="${this.id}">${this.url}</span>
      ${buttons}
      <button @click="${actionFactory("timeout")}" title="Timeout">
        <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 48 48">
          <path
            d="M23.9 44q-4.15 0-7.8-1.575-3.65-1.575-6.35-4.275-2.7-2.7-4.275-6.35Q3.9 28.15 3.9 24t1.575-7.8Q7.05 12.55 9.75 9.85q2.7-2.7 6.35-4.275Q19.75 4 23.9 4q4.4 0 8.325 1.8Q36.15 7.6 39 10.9L23.9 26V7q-7.1 0-12.05 4.95Q6.9 16.9 6.9 24q0 7.1 4.95 12.05Q16.8 41 23.9 41q4.05 0 7.675-1.825T37.85 34.2v4.15q-2.85 2.7-6.45 4.175Q27.8 44 23.9 44Zm16.95-7.35V20.3h3v16.35Zm1.65 7q-.7 0-1.175-.475Q40.85 42.7 40.85 42q0-.7.475-1.175.475-.475 1.175-.475.7 0 1.175.475.475.475.475 1.175 0 .7-.475 1.175-.475.475-1.175.475Z"
          />
        </svg>
      </button>
      <button @click="${actionFactory("mp3error")}" title="MP3 Error">
        <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 48 48">
          <path
            d="M24 34q.7 0 1.175-.475.475-.475.475-1.175 0-.7-.475-1.175Q24.7 30.7 24 30.7q-.7 0-1.175.475-.475.475-.475 1.175 0 .7.475 1.175Q23.3 34 24 34Zm.15-7.65q.65 0 1.075-.425.425-.425.425-1.075V15.2q0-.65-.425-1.075-.425-.425-1.075-.425-.65 0-1.075.425-.425.425-.425 1.075v9.65q0 .65.425 1.075.425.425 1.075.425ZM24 44q-4.1 0-7.75-1.575-3.65-1.575-6.375-4.3-2.725-2.725-4.3-6.375Q4 28.1 4 23.95q0-4.1 1.575-7.75 1.575-3.65 4.3-6.35 2.725-2.7 6.375-4.275Q19.9 4 24.05 4q4.1 0 7.75 1.575 3.65 1.575 6.35 4.275 2.7 2.7 4.275 6.35Q44 19.85 44 24q0 4.1-1.575 7.75-1.575 3.65-4.275 6.375t-6.35 4.3Q28.15 44 24 44Zm.05-3q7.05 0 12-4.975T41 23.95q0-7.05-4.95-12T24 7q-7.05 0-12.025 4.95Q7 16.9 7 24q0 7.05 4.975 12.025Q16.95 41 24.05 41ZM24 24Z"
          />
        </svg>
      </button>
    </div>`;
  }
}
