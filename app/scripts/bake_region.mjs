// 광역 위성영상 + 광역 저해상 표고그리드 베이크 — 동아시아(한국·일본·중국 동안) 광역 bbox.
//   ① ESRI World Imagery 타일 스티칭·등각재투영 → public/twin/region.jpg
//   ② AWS Terrarium 표고 타일 스티칭·등각재샘플 → public/twin/region_dem.json (육/해 마스크용)
//   타일수학·스티칭·bilinear 등각재샘플은 bake_aerial.mjs / bake_dem.mjs와 동일.
//   bbox.mjs는 import하지 않고 광역 bbox를 하드코딩한다.
// 출력: app/public/twin/region.jpg, region_dem.json, region_meta.json
import sharp from "sharp";
import { statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..");
const OUT_JPG = resolve(APP_DIR, "public/twin/region.jpg");
const OUT_DEM = resolve(APP_DIR, "public/twin/region_dem.json");
const META = resolve(APP_DIR, "public/twin/region_meta.json");

// ── 하드코딩 광역 bbox [W, S, E, N] WGS84(deg) ──
const W = 117.0, S = 19.0, E = 150.0, N = 48.0;

const Z = Number(process.argv[2] || 6);
const TILE = 256;

// Web Mercator 전역 픽셀 변환 (bake_aerial.mjs와 동일)
const nTiles = 2 ** Z;
const lon2px = (lon) => ((lon + 180) / 360) * nTiles * TILE;
const lat2px = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * nTiles * TILE;
};

// 미터 종횡비 유지(등각 출력)
const latC = (S + N) / 2;
const mPerLon = 111320 * Math.cos((latC * Math.PI) / 180);
const mPerLat = 111132;
const sizeW = Math.round((E - W) * mPerLon);
const sizeD = Math.round((N - S) * mPerLat);

// region.jpg 출력 해상도 — 긴 변 ~1800px, 미터 종횡비 유지
const LONG = 1800;
const aspect = sizeW / sizeD;
const OUTW = aspect >= 1 ? LONG : Math.max(1, Math.round(LONG * aspect));
const OUTH = aspect >= 1 ? Math.max(1, Math.round(LONG / aspect)) : LONG;

// region_dem.json 그리드 — nx≈420, ny는 미터 종횡비에 비례
const NX = 420;
const NY = Math.max(1, Math.round(NX * sizeD / sizeW));

const esriURL = (z, x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
const terrariumURL = (z, x, y) =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

// bbox를 덮는 타일 x/y 범위 (북쪽=작은 y)
const x0 = Math.floor(lon2px(W) / TILE);
const x1 = Math.floor(lon2px(E) / TILE);
const yTop = Math.floor(lat2px(N) / TILE);
const yBot = Math.floor(lat2px(S) / TILE);
const txs = []; for (let x = x0; x <= x1; x++) txs.push(x);
const tys = []; for (let y = yTop; y <= yBot; y++) tys.push(y);

const SW = txs.length * TILE, SH = tys.length * TILE;
const originPx = x0 * TILE, originPy = yTop * TILE;

console.log(
  `region bbox=[${W},${S},${E},${N}] zoom=${Z}\n` +
  `tiles x:${x0}..${x1}(${txs.length}) y:${yTop}..${yBot}(${tys.length}) = ${txs.length * tys.length}\n` +
  `stitch ${SW}x${SH}px → jpg ${OUTW}x${OUTH}px · dem ${NX}x${NY}`
);

async function fetchBuf(url, tries = 4) {
  let lastErr;
  for (let t = 0; t < tries; t++) {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 20000);
    try {
      const res = await fetch(url, { signal: ac.signal, headers: { "User-Agent": "team_H-region/1.0" } });
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

// 공용 타일 다운로드 워커 (concurrency 제한)
async function downloadAll(makeURL, onTile) {
  const jobs = [];
  tys.forEach((y, yi) => txs.forEach((x, xi) => jobs.push({ x, y, xi, yi })));
  const total = jobs.length;
  let done = 0;
  const CONC = 8;
  async function worker() {
    while (jobs.length) {
      const j = jobs.pop();
      const buf = await fetchBuf(makeURL(Z, j.x, j.y));
      await onTile(buf, j);
      done++;
      process.stdout.write(`\r  downloaded ${done}/${total} tiles`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  process.stdout.write("\n");
  return total;
}

// ════════════════════════════════════════════════════════════════════
// ① region.jpg — ESRI World Imagery
// ════════════════════════════════════════════════════════════════════
const rgb = Buffer.alloc(SW * SH * 3); // RGB stitch
const totalJpg = await downloadAll(esriURL, async (buf, j) => {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const ox = j.xi * TILE, oy = j.yi * TILE;
  for (let py = 0; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const p = (py * TILE + px) * ch;
      const q = ((oy + py) * SW + (ox + px)) * 3;
      rgb[q] = data[p]; rgb[q + 1] = data[p + 1]; rgb[q + 2] = data[p + 2];
    }
  }
});

// 글로벌 픽셀 → stitch 로컬, 채널별 bilinear
function sampleRGB(gx, gy, out, oi) {
  let lx = gx - originPx, ly = gy - originPy;
  if (lx < 0) lx = 0; else if (lx > SW - 1) lx = SW - 1;
  if (ly < 0) ly = 0; else if (ly > SH - 1) ly = SH - 1;
  const xa = Math.floor(lx), ya = Math.floor(ly);
  const xb = Math.min(xa + 1, SW - 1), yb = Math.min(ya + 1, SH - 1);
  const fx = lx - xa, fy = ly - ya;
  for (let c = 0; c < 3; c++) {
    const v00 = rgb[(ya * SW + xa) * 3 + c], v10 = rgb[(ya * SW + xb) * 3 + c];
    const v01 = rgb[(yb * SW + xa) * 3 + c], v11 = rgb[(yb * SW + xb) * 3 + c];
    const a = v00 * (1 - fx) + v10 * fx;
    const b = v01 * (1 - fx) + v11 * fx;
    out[oi + c] = Math.round(a * (1 - fy) + b * fy);
  }
}

const outImg = Buffer.alloc(OUTW * OUTH * 3);
for (let j = 0; j < OUTH; j++) {
  const lat = N + (S - N) * (j / (OUTH - 1)); // j=0 → N(상단)
  const gy = lat2px(lat);
  for (let i = 0; i < OUTW; i++) {
    const lon = W + (E - W) * (i / (OUTW - 1)); // i=0 → W(좌)
    const gx = lon2px(lon);
    sampleRGB(gx, gy, outImg, (j * OUTW + i) * 3);
  }
}
await sharp(outImg, { raw: { width: OUTW, height: OUTH, channels: 3 } })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT_JPG);

// ════════════════════════════════════════════════════════════════════
// ② region_dem.json — AWS Terrarium 표고 (육/해 마스크용)
// ════════════════════════════════════════════════════════════════════
const elev = new Float32Array(SW * SH);
const totalDem = await downloadAll(terrariumURL, async (buf, j) => {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels; // terrarium RGB
  const ox = j.xi * TILE, oy = j.yi * TILE;
  for (let py = 0; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const p = (py * TILE + px) * ch;
      const e = data[p] * 256 + data[p + 1] + data[p + 2] / 256 - 32768;
      elev[(oy + py) * SW + (ox + px)] = e;
    }
  }
});

function sampleElev(gx, gy) {
  let lx = gx - originPx, ly = gy - originPy;
  if (lx < 0) lx = 0; else if (lx > SW - 1) lx = SW - 1;
  if (ly < 0) ly = 0; else if (ly > SH - 1) ly = SH - 1;
  const xa = Math.floor(lx), ya = Math.floor(ly);
  const xb = Math.min(xa + 1, SW - 1), yb = Math.min(ya + 1, SH - 1);
  const fx = lx - xa, fy = ly - ya;
  const v00 = elev[ya * SW + xa], v10 = elev[ya * SW + xb];
  const v01 = elev[yb * SW + xa], v11 = elev[yb * SW + xb];
  const a = v00 * (1 - fx) + v10 * fx;
  const b = v01 * (1 - fx) + v11 * fx;
  return a * (1 - fy) + b * fy;
}

// 등간격 격자 샘플: i=0→W(좌), j=0→N(상단), index = j*NX + i  (bake_dem.mjs와 동일)
const demData = new Array(NX * NY);
let dmin = Infinity, dmax = -Infinity;
for (let j = 0; j < NY; j++) {
  const lat = N + (S - N) * (j / (NY - 1));
  const gy = lat2px(lat);
  for (let i = 0; i < NX; i++) {
    const lon = W + (E - W) * (i / (NX - 1));
    const gx = lon2px(lon);
    const e = Math.round(sampleElev(gx, gy));
    demData[j * NX + i] = e;
    if (e < dmin) dmin = e;
    if (e > dmax) dmax = e;
  }
}
writeFileSync(OUT_DEM, JSON.stringify({ nx: NX, ny: NY, bbox: [W, S, E, N], data: demData }));

// ── 메타 ──
writeFileSync(META, JSON.stringify({ bbox: [W, S, E, N] }) + "\n");

const kb = (statSync(OUT_JPG).size / 1024).toFixed(0);
const demKb = (statSync(OUT_DEM).size / 1024).toFixed(0);
console.log(
  `baked region → ${OUT_JPG}\n  ${OUTW}x${OUTH}px · ${kb} KB · ${totalJpg} tiles\n` +
  `baked region DEM → ${OUT_DEM}\n  ${NX}x${NY} grid · ${demKb} KB · ${totalDem} tiles · elev min ${dmin} / max ${dmax} m\n` +
  `meta → ${META}`
);
