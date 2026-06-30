// 위성 항공영상 베이크 — ESRI World Imagery 타일을 공통 bbox로 스티칭·등각재투영.
//   타일: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
// DEM·건물과 "동일 bbox + 동일 등각(lon/lat 선형) 투영"으로 출력 → 픽셀단위 정렬.
// 출력: app/public/twin/aerial.jpg
import sharp from "sharp";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BBOX, derive, mercator } from "./bbox.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..");
const OUT = resolve(APP_DIR, "public/twin/aerial.jpg");

const { W, S, E, N } = BBOX;
const { sizeW, sizeD } = derive();
const Z = Number(process.argv[2] || 16); // ~2.4 m/px
const TILE = 256;
const { lon2px, lat2px } = mercator(Z, TILE);

// 출력 해상도 — 긴 변 ~2600px, 미터 종횡비 유지(드레이프 왜곡 최소화)
const LONG = 2600;
const aspect = sizeW / sizeD;
const OUTW = aspect >= 1 ? LONG : Math.max(1, Math.round(LONG * aspect));
const OUTH = aspect >= 1 ? Math.max(1, Math.round(LONG / aspect)) : LONG;

const tileURL = (z, x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

const x0 = Math.floor(lon2px(W) / TILE);
const x1 = Math.floor(lon2px(E) / TILE);
const yTop = Math.floor(lat2px(N) / TILE);
const yBot = Math.floor(lat2px(S) / TILE);
const txs = []; for (let x = x0; x <= x1; x++) txs.push(x);
const tys = []; for (let y = yTop; y <= yBot; y++) tys.push(y);

const SW = txs.length * TILE, SH = tys.length * TILE;
const originPx = x0 * TILE, originPy = yTop * TILE;
const canvas = Buffer.alloc(SW * SH * 3); // RGB stitch

console.log(
  `aerial bbox=[${W},${S},${E},${N}] zoom=${Z}\n` +
  `tiles x:${x0}..${x1}(${txs.length}) y:${yTop}..${yBot}(${tys.length}) = ${txs.length * tys.length}\n` +
  `stitch ${SW}x${SH}px → equirect output ${OUTW}x${OUTH}px`
);

async function fetchBuf(url, tries = 4) {
  let lastErr;
  for (let t = 0; t < tries; t++) {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 20000);
    try {
      const res = await fetch(url, { signal: ac.signal, headers: { "User-Agent": "team_H-aerial/1.0" } });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      clearTimeout(to); lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (t + 1)));
    }
  }
  throw lastErr;
}

const jobs = [];
tys.forEach((y, yi) => txs.forEach((x, xi) => jobs.push({ x, y, xi, yi })));
const total = jobs.length;
let done = 0;
const CONC = 8;
async function worker() {
  while (jobs.length) {
    const j = jobs.pop();
    const buf = await fetchBuf(tileURL(Z, j.x, j.y));
    const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    const ox = j.xi * TILE, oy = j.yi * TILE;
    for (let py = 0; py < TILE; py++) {
      for (let px = 0; px < TILE; px++) {
        const p = (py * TILE + px) * ch;
        const q = ((oy + py) * SW + (ox + px)) * 3;
        canvas[q] = data[p]; canvas[q + 1] = data[p + 1]; canvas[q + 2] = data[p + 2];
      }
    }
    done++;
    process.stdout.write(`\r  downloaded ${done}/${total} tiles`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
process.stdout.write("\n");

// 글로벌 픽셀 → stitch 로컬, 채널별 bilinear
function sampleRGB(gx, gy, out, oi) {
  let lx = gx - originPx, ly = gy - originPy;
  if (lx < 0) lx = 0; else if (lx > SW - 1) lx = SW - 1;
  if (ly < 0) ly = 0; else if (ly > SH - 1) ly = SH - 1;
  const xa = Math.floor(lx), ya = Math.floor(ly);
  const xb = Math.min(xa + 1, SW - 1), yb = Math.min(ya + 1, SH - 1);
  const fx = lx - xa, fy = ly - ya;
  for (let c = 0; c < 3; c++) {
    const v00 = canvas[(ya * SW + xa) * 3 + c], v10 = canvas[(ya * SW + xb) * 3 + c];
    const v01 = canvas[(yb * SW + xa) * 3 + c], v11 = canvas[(yb * SW + xb) * 3 + c];
    const a = v00 * (1 - fx) + v10 * fx;
    const b = v01 * (1 - fx) + v11 * fx;
    out[oi + c] = Math.round(a * (1 - fy) + b * fy);
  }
}

const out = Buffer.alloc(OUTW * OUTH * 3);
for (let j = 0; j < OUTH; j++) {
  const lat = N + (S - N) * (j / (OUTH - 1)); // j=0 → N(상단)
  const gy = lat2px(lat);
  for (let i = 0; i < OUTW; i++) {
    const lon = W + (E - W) * (i / (OUTW - 1)); // i=0 → W(좌)
    const gx = lon2px(lon);
    sampleRGB(gx, gy, out, (j * OUTW + i) * 3);
  }
}

await sharp(out, { raw: { width: OUTW, height: OUTH, channels: 3 } })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(OUT);

const kb = (statSync(OUT).size / 1024).toFixed(0);
console.log(`baked aerial → ${OUT}\n  ${OUTW}x${OUTH}px · ${kb} KB · ${total} tiles`);
