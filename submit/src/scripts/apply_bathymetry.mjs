// 실측 수심 반영 — NOAA ETOPO1(ERDDAP)에서 bbox 수심을 받아 dem.json '바다셀'에 적용.
// 육상(Terrarium 실표고)은 그대로 두고, 바다셀의 '합성수심'만 실측 수심으로 교체한다.
//   실행: node scripts/apply_bathymetry.mjs   (submit/src 에서)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BBOX } from "./bbox.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEM = resolve(__dirname, "..", "public/twin/dem.json");
const { W, S, E, N } = BBOX;
const CLAMP = -60; // 표시 범위(과도한 심해 억제)

const url = `https://coastwatch.pfeg.noaa.gov/erddap/griddap/etopo180.json?altitude[(${S}):(${N})][(${W}):(${E})]`;
console.log("ETOPO1 fetch:", url);
const res = await fetch(url);
if (!res.ok) throw new Error("ETOPO fetch 실패 " + res.status);
const j = await res.json();
const rows = j.table.rows; // [lat, lon, alt(m)]

const lats = [...new Set(rows.map((r) => r[0]))].sort((a, b) => a - b);
const lons = [...new Set(rows.map((r) => r[1]))].sort((a, b) => a - b);
const grid = new Map();
for (const [la, lo, alt] of rows) grid.set(la + "|" + lo, alt);
console.log(`ETOPO 격자 ${lons.length}×${lats.length} (경도×위도)`);

const binPos = (arr, v) => {
  if (v <= arr[0]) return 0;
  if (v >= arr[arr.length - 1]) return arr.length - 1;
  let lo = 0, hi = arr.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] <= v) lo = m; else hi = m; }
  return lo + (v - arr[lo]) / (arr[hi] - arr[lo]);
};
function sampleEtopo(lon, lat) {
  const fi = binPos(lons, lon), fj = binPos(lats, lat);
  const i0 = Math.floor(fi), j0 = Math.floor(fj);
  const i1 = Math.min(i0 + 1, lons.length - 1), j1 = Math.min(j0 + 1, lats.length - 1);
  const tx = fi - i0, ty = fj - j0;
  const g = (i, jx) => grid.get(lats[jx] + "|" + lons[i]) ?? 0;
  const a = g(i0, j0) + (g(i1, j0) - g(i0, j0)) * tx;
  const b = g(i0, j1) + (g(i1, j1) - g(i0, j1)) * tx;
  return a + (b - a) * ty;
}

const dem = JSON.parse(readFileSync(DEM, "utf8"));
const { nx, ny, data } = dem;
let seaCells = 0, applied = 0, seaN = 0, seaS = 0, min = Infinity, max = -Infinity;
for (let jj = 0; jj < ny; jj++) {
  const lat = N - (jj / (ny - 1)) * (N - S); // j=0 → 북(N), j=ny-1 → 남(S)  (FloodTwin 소비 규약과 일치)
  for (let ii = 0; ii < nx; ii++) {
    const lon = W + (ii / (nx - 1)) * (E - W);
    const k = jj * nx + ii;
    if (data[k] < 0.3) { // 현재 바다셀만
      seaCells++;
      jj < ny / 2 ? seaN++ : seaS++;
      const alt = sampleEtopo(lon, lat);
      if (alt < 0) { data[k] = Math.round(Math.max(alt, CLAMP) * 10) / 10; applied++; }
      else data[k] = -0.5; // ETOPO는 육지지만 dem은 바다(해안선 근처) → 얕은 물
    }
    if (data[k] < min) min = data[k];
    if (data[k] > max) max = data[k];
  }
}
dem.min = min; dem.max = max;
dem.bathymetry = "NOAA ETOPO1(ERDDAP) 실측 수심 반영(바다셀) + AWS Terrarium 실표고(육상)";
writeFileSync(DEM, JSON.stringify(dem));
console.log(`바다셀=${seaCells} (북측 ${seaN}/남측 ${seaS} — 남쪽이 많아야 정상) · ETOPO적용=${applied}`);
console.log(`수심/표고 범위: min=${min}m  max=${max}m  → dem.json 갱신 완료`);
