import { IncomingMessage } from 'http';
import { defineConfig } from "vite";

import eslint from "vite-plugin-eslint";

const apiConst = "/stream";

const responseCache: Record<string, {
  closed: boolean,
  m38u: Record<string, string>
}> = {};

export default defineConfig({
  plugins: [
    eslint({
      failOnWarning: false,
      failOnError: false,
    }),
  ],
  server: {
    proxy: {
      "^.*/stream/close": {
        target: "http://mcdn.daserste.de",
        changeOrigin: true,
        bypass(req, res) {
          const index = req.url?.indexOf(apiConst);
          if (typeof index !== "undefined" && index >= 0 && req.url) {

            const key = req.url.slice(0, index);
            if (responseCache[key]) {
              responseCache[key].closed = true;
            }
            res.write(`${key} stopped`);
          }
          res.end();
        }
      },
      "^.*/stream/.*m3u8": {
        target: "http://mcdn.daserste.de",
        changeOrigin: true,
        configure: (proxy, options) => {
          console.info(options);
          proxy.on("proxyReq", (proxyRes, req, res) => {
            const index = req.url?.indexOf(apiConst);
            if (typeof index !== "undefined" && index >= 0 && req.url) {
              const key = req.url.slice(0, index);
              proxyRes.path = proxyRes.path.slice(index + apiConst.length);
              proxyRes.removeHeader("accept-encoding");
              if (responseCache[key]?.closed) {
                res.write(responseCache[key].m38u[req.url]);
                res.write(`\n#EXT-X-ENDLIST\n`)
                res.end();
              }
            }
          });
          proxy.on("proxyRes", async (proxyRes, req) => {
            const index = req.url?.indexOf(apiConst);
            if (typeof index !== "undefined" && index >= 0 && req.url) {
              const key = req.url.slice(0, index);
              const body = await readResponseBody(proxyRes);
              if (!responseCache[key]) {
                responseCache[key] = { closed: false, m38u: {} };
              }
              responseCache[key].m38u[req.url] = body;
            }
            console.info(responseCache);
          });
        },
      },
      "^.*/stream/.*": {
        target: "http://mcdn.daserste.de",
        changeOrigin: true,
        configure: (proxy, options) => {
          console.info(options);
          proxy.on("proxyReq", (proxyRes, req) => {
            const index = req.url?.indexOf(apiConst);
            if (typeof index !== "undefined" && index >= 0 && req.url) {
              proxyRes.path = proxyRes.path.slice(index + apiConst.length);
            }
          });
        },
      },
    },
  },
});
async function readResponseBody(proxyRes: IncomingMessage) {
  const bodyPromise = new Promise<string>((resolve) => {
    proxyRes.on("data", (dataBuffer) => {
      const data = dataBuffer.toString("utf8");
      resolve(data);
    });
  });
  const body = await bodyPromise;
  return body;
}

