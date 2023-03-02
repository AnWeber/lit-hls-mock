import { defineConfig } from "vite";

import eslint from "vite-plugin-eslint";

const M3U8Folder = "streams";
const MP3_MIN_BUFFER_MILLISECONDS = 1000;

import { default as fs } from "fs";
import { join } from "path";
import { IncomingMessage, ServerResponse } from "http";

type ExtInf = {
  duration: number;
  raw: Array<string>;
};
type M3U8Cache = {
  stopTime?: number;
  startTime: number;
  timeout?: number;
  mp3error?: number;
  header: string;
  extInfs: Array<ExtInf>;
};
const responseCache: Record<string, M3U8Cache> = {};

export default defineConfig({
  publicDir: './streams',
  plugins: [
    eslint({
      failOnWarning: false,
      failOnError: false,
    }),
  ],
  server: {
    proxy: {
      "^/local/.*/action": {
        target: "http://localhost:5173",
        changeOrigin: true,
        bypass(req, res) {
          const trackId = req?.url && getTrackId(req.url);
          if (req.url && trackId && responseCache[trackId]) {
            const m3u8 = responseCache[trackId];
            if (req.url.indexOf("stop=true") > 0) {
              m3u8.stopTime = Date.now();
            } else if (req.url.indexOf("timeout=true") > 0) {
              m3u8.timeout = m3u8.timeout || 0 + 1;
            } else if (req.url.indexOf("mp3error=true") > 0) {
              m3u8.mp3error = m3u8.mp3error || 0 + 1;
            }
            res.write(`${trackId} action performed`);
          }
          res.end();
          return "bypass";
        },
      },
      "^/local/.*.m3u8": {
        target: "http://localhost:5173",
        changeOrigin: true,
        bypass: (req, res) => {
          if (req?.url) {
            const trackId = getTrackId(req.url);
            if (!responseCache[trackId]) {
              responseCache[trackId] = parseM3U8(req.url);
            }
            if (req.url.indexOf("vod=true") > 0) {
              streamFile(req.url, res);
            } else if (req.url.indexOf("hlserror=true") > 0) {
              res.writeHead(500, "random mock error");
              res.write("Fail");
              res.end();
            } else if (req.url.indexOf("timeout=true") > 0) {
              res.writeHead(200, "incoming timeout");
              setTimeout(() => {
                res.write("Fail");
                res.end();
              }, 60000);
            } else {
              const m3u8Data = responseCache[trackId];
              const hls = getHls(m3u8Data);
              res.write(hls);
              res.end();
            }
            return "bypass";
          }
          return false;
        },
      },
      "^/local/.*.mp3": {
        target: "http://localhost:5173",
        changeOrigin: true,
        bypass: (req, res) => {
          if (req?.url) {
            const trackId = getTrackId(req.url);
            const m3u8 = responseCache[trackId];
            if (m3u8?.timeout && m3u8.timeout > 0) {
              m3u8.timeout--;
              res.writeHead(200, "incoming timeout");
              setTimeout(() => {
                res.write(`timeoutcount ${m3u8.timeout}`);
                res.end();
              }, 60000);
            } else if (m3u8?.mp3error && m3u8.mp3error > 0) {
              m3u8.mp3error--;
              res.writeHead(500, "incoming error");
              res.write(`failcount ${m3u8.mp3error}`);
              res.end();
            } else {
              streamFile(req.url, res);
            }
            return "bypass";
          }
          return false;
        },
      },
    },
  },
});

function streamFile(url: string, res: ServerResponse<IncomingMessage>) {
  const filename = getFilePath(url);
  const stat = fs.statSync(filename);

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Content-Length": stat.size,
  });

  const stream = fs.createReadStream(filename);
  stream.pipe(res);
}

function getFilePath(url: string) {
  let track = url.slice("/local/".length);
  const queryIndex = track.indexOf("?");
  if (queryIndex > 0) {
    track = track.slice(0, queryIndex);
  }
  // eslint-disable-next-line no-undef
  return join(__dirname, M3U8Folder, track.slice(track.indexOf("/") + 1));
}

function getTrackId(url: string) {
  const track = url.slice("/local/".length);
  return track.slice(0, track.indexOf("/"));
}

function parseM3U8(url: string) {
  const m38uLines = fs
    .readFileSync(getFilePath(url), "utf-8")
    .trim()
    .split(/\r?\n/gu)
    .map((line) => line.trim());
  if (m38uLines.length === 0 || m38uLines[0] !== "#EXTM3U") {
    throw new Error("No #EXTM3U start");
  }
  const header: Array<string> = [];
  const extInfs: Array<ExtInf> = [];
  let data: ExtInf | undefined;
  for (const line of m38uLines) {
    const extInfMatch =
      /^#EXTINF:(?<duration>[+-]?([0-9]*[.])?[0-9]+),?(?<title>.*)$/u.exec(
        line
      );
    if (extInfMatch?.groups?.duration) {
      const duration = parseFloat(extInfMatch.groups.duration);
      if (!isNaN(duration)) {
        data = {
          duration,
          raw: [line],
        };
        extInfs.push(data);
      }
    } else if (line !== "#EXT-X-ENDLIST") {
      if (!data) {
        header.push(line);
      } else {
        data.raw.push(line);
      }
    }
  }
  return {
    startTime: Date.now(),
    header: header.join("\n"),
    extInfs,
  };
}

function getHls(m3u8: M3U8Cache) {
  const result = [m3u8.header];
  const currentTime = m3u8.stopTime || Date.now() + MP3_MIN_BUFFER_MILLISECONDS;

  let loopTime = m3u8.startTime;
  const index = 0;
  while (loopTime < currentTime) {
    const indexInArray = index % m3u8.extInfs.length;
    const extinf = m3u8.extInfs[indexInArray];
    result.push(...extinf.raw);
    const durationInMs = extinf.duration * 1000;
    console.info(durationInMs);
    loopTime += durationInMs;
  }

  if (m3u8.stopTime) {
    result.push("#EXT-X-ENDLIST");
  }
  return result.join(`\n`);
}
