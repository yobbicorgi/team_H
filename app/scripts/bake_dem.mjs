// DEM(지형고도) 그리드 베이크 — 부산 해운대권
// AWS Terrarium 무료 타일(무키)로 bbox를 덮는 타일을 받아 stitch → bbox 잘라 다운샘플.
//   타일: https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
//   고도 디코드: elev_m = R*256 + G + B/256 - 32768  (해양은 음수)
// 출력: app/public/twin/dem.json
import sharp from "sharp";
import { writeFileSync, mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BBOX, derive, mercator } from "./bbox.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..");
const OUT = resolve(APP_DIR, "public/twin/dem.json");

// ── 대상 bbox (공통 모듈) ─────────────────────────────────────────
const { W, S, E, N } = BBOX;
const { sizeW, sizeD } = derive();
// 출력 그리드 — 약 ~28m/픽셀(해안선·침수 정밀도), 긴 변 256~360 캡
const NX = Math.min(360, Math.max(220, Math.round(sizeW / 28)));
const NY = Math.min(360, Math.max(220, Math.round(sizeD / 28)));
const Z = 14;                       // zoom (~9.5 m/px)
const TILE = 256;
const tileURL = (z, x, y) =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

// ── 슬리피맵 좌표 변환 (글로벌 픽셀 공간) ──────────────────────────
const { lon2px, lat2px } = mercator(Z, TILE);

// bbox를 덮는 타일 x/y 범위 (북쪽=작은 y)
const x0 = Math.floor(lon2px(W) / TILE);
const x1 = Math.floor(lon2px(E) / TILE);
const yTop = Math.floor(lat2px(N) / TILE);
const yBot = Math.floor(lat2px(S) / TILE);
const txs = [];
for (let x = x0; x <= x1; x++) txs.push(x);
const tys = [];
for (let y = yTop; y <= yBot; y++) tys.push(y);

// ── 다운로드 (재시도 + 타임아웃) ──────────────────────────────────
async function fetchBuf(url, tries = 4) {
  let lastErr;
  for (let t = 0; t < tries; t++) {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 20000);
    try {
      const res = await fetch(url, {
        signal: ac.signal,
        headers: { "User-Agent": "team_H-dem-baker/1.0" },
      });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      clearTimeout(to);
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * (t + 1)));
    }
  }
  throw lastErr;
}

// ── stitch 캔버스 ─────────────────────────────────────────────────
const SW = txs.length * TILE;
const SH = tys.length * TILE;
const grid = new Float32Array(SW * SH);
const originPx = x0 * TILE;
const originPy = yTop * TILE;

console.log(
  `bbox=[${W},${S},${E},${N}]  zoom=${Z}\n` +
    `tiles x:${x0}..${x1} (${txs.length})  y:${yTop}..${yBot} (${tys.length})  = ${txs.length * tys.length} tiles\n` +
    `stitched ${SW}x${SH}px → downsample to ${NX}x${NY}`
);

let done = 0;
const total = txs.length * tys.length;
await Promise.all(
  tys.flatMap((y, yi) =>
    txs.map(async (x, xi) => {
      const buf = await fetchBuf(tileURL(Z, x, y));
      const { data, info } = await sharp(buf)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const ch = info.channels; // terrarium=3 (RGB)
      const ox = xi * TILE;
      const oy = yi * TILE;
      for (let py = 0; py < TILE; py++) {
        for (let px = 0; px < TILE; px++) {
          const p = (py * TILE + px) * ch;
          const elev = data[p] * 256 + data[p + 1] + data[p + 2] / 256 - 32768;
          grid[(oy + py) * SW + (ox + px)] = elev;
        }
      }
      done++;
      process.stdout.write(`\r  downloaded ${done}/${total} tiles`);
    })
  )
);
process.stdout.write("\n");

// ── bilinear 샘플 (글로벌 픽셀 → stitch 로컬) ─────────────────────
function sample(gx, gy) {
  let lx = gx - originPx;
  let ly = gy - originPy;
  if (lx < 0) lx = 0; else if (lx > SW - 1) lx = SW - 1;
  if (ly < 0) ly = 0; else if (ly > SH - 1) ly = SH - 1;
  const xa = Math.floor(lx), ya = Math.floor(ly);
  const xb = Math.min(xa + 1, SW - 1), yb = Math.min(ya + 1, SH - 1);
  const fx = lx - xa, fy = ly - ya;
  const v00 = grid[ya * SW + xa], v10 = grid[ya * SW + xb];
  const v01 = grid[yb * SW + xa], v11 = grid[yb * SW + xb];
  const a = v00 * (1 - fx) + v10 * fx;
  const b = v01 * (1 - fx) + v11 * fx;
  return a * (1 - fy) + b * fy;
}

// ── bbox 격자(등간격, row-major) 샘플 ────────────────────────────
//   i: 서(0)→동(NX-1) , j: 북(0)→남(NY-1) , index = j*NX + i
const data = new Array(NX * NY);
let min = Infinity, max = -Infinity;
for (let j = 0; j < NY; j++) {
  const lat = N + (S - N) * (j / (NY - 1)); // j=0→N, j=NY-1→S
  const gy = lat2px(lat);
  for (let i = 0; i < NX; i++) {
    const lon = W + (E - W) * (i / (NX - 1)); // i=0→W, i=NX-1→E
    const gx = lon2px(lon);
    const e = Math.round(sample(gx, gy) * 10) / 10;
    data[j * NX + i] = e;
    if (e < min) min = e;
    if (e > max) max = e;
  }
}

// ── 바다 마스크(경계 플러드필) + 수심 합성 ────────────────────────
// Terrarium은 연안 바다를 표고 0으로 줘서 육/해 구분이 안 됨 → 경계에서
// 표고<임계 연결영역을 바다로 보고, 해안거리 기반 합성수심(+실측 깊은수심)으로 음수화.
const NCELL = NX * NY;
const SEA_THRESH = 1.4, DMAX = 45, LSCALE = 2000, DEPTH_CLAMP = 120;
const cellM = (sizeW / NX + sizeD / NY) / 2;
const idx = (i, j) => j * NX + i;
const sea = new Uint8Array(NCELL);
const queue = new Int32Array(NCELL);
let qh = 0, qt = 0;
const seed = (i, j) => { const k = idx(i, j); if (!sea[k] && data[k] < SEA_THRESH) { sea[k] = 1; queue[qt++] = k; } };
for (let i = 0; i < NX; i++) { seed(i, 0); seed(i, NY - 1); }
for (let j = 0; j < NY; j++) { seed(0, j); seed(NX - 1, j); }
while (qh < qt) {
  const k = queue[qh++]; const i = k % NX, j = (k - i) / NX;
  const nb = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]];
  for (const [a, b] of nb) { if (a < 0 || b < 0 || a >= NX || b >= NY) continue; const nk = idx(a, b); if (!sea[nk] && data[nk] < SEA_THRESH) { sea[nk] = 1; queue[qt++] = nk; } }
}
// 해안거리 BFS (육상=0에서 바다로 +1 전파)
const dist = new Int32Array(NCELL).fill(-1);
qh = 0; qt = 0;
for (let k = 0; k < NCELL; k++) if (!sea[k]) { dist[k] = 0; queue[qt++] = k; }
while (qh < qt) {
  const k = queue[qh++]; const i = k % NX, j = (k - i) / NX; const d = dist[k];
  const nb = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]];
  for (const [a, b] of nb) { if (a < 0 || b < 0 || a >= NX || b >= NY) continue; const nk = idx(a, b); if (dist[nk] === -1) { dist[nk] = d + 1; queue[qt++] = nk; } }
}
// 병합: 바다=음수 수심(실측 깊은값 우선, 결손은 해안거리 합성), 육상=실표고
let seaCells = 0;
min = Infinity; max = -Infinity;
for (let k = 0; k < NCELL; k++) {
  let v;
  if (sea[k]) {
    seaCells++;
    const raw = data[k];
    let depth = raw < -1 ? Math.min(-raw, DEPTH_CLAMP) : DMAX * (1 - Math.exp(-(dist[k] * cellM) / LSCALE));
    depth = Math.max(0.5, Math.min(DEPTH_CLAMP, depth));
    v = -depth;
  } else {
    v = Math.max(0.3, data[k]);
  }
  v = Math.round(v * 10) / 10;
  data[k] = v;
  if (v < min) min = v;
  if (v > max) max = v;
}

const out = {
  nx: NX, ny: NY, bbox: [W, S, E, N], min, max, data,
  seaFraction: Math.round((seaCells / NCELL) * 1000) / 1000,
  bathymetry: "Terrarium 실표고 + 경계 플러드필 바다마스크 → 해안거리 합성수심(실측 깊은값 우선)",
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));

const kb = (statSync(OUT).size / 1024).toFixed(0);
console.log(
  `\nbaked DEM → ${OUT}\n` +
    `  grid     : ${NX} x ${NY}  (${NX * NY} samples)\n` +
    `  elevation: min ${min.toFixed(1)} m  /  max ${max.toFixed(1)} m\n` +
    `  tiles     : ${total}\n` +
    `  file size : ${kb} KB`
);
