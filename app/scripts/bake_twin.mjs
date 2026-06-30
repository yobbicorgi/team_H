// OSM Overpass 건물 → 씬 로컬 좌표(미터) + 높이 베이크.
// 입력: /tmp/osm_buildings.json (Overpass out geom)
// 출력: app/public/twin/buildings.json
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BBOX, derive } from "./bbox.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..");
const SRC = process.argv[2] || resolve(APP_DIR, "osm_raw.json");
const OUT = resolve(APP_DIR, "public/twin/buildings.json");

// 씬 bbox (공통 모듈) — 항공·DEM과 동일 bbox/등각투영 → 픽셀단위 정합
const { W, S, E, N } = BBOX;
const { lonC, latC, mPerLon: M_PER_DEG_LON, mPerLat: M_PER_DEG_LAT, sizeW, sizeD } = derive();

// x=동(+), z=남(+) → 북쪽은 -z
const toX = (lon) => (lon - lonC) * M_PER_DEG_LON;
const toZ = (lat) => (latC - lat) * M_PER_DEG_LAT;

const LANDMARKS = [
  { kw: ["lct", "엘시티", "el city", "elcity"], h: 411 },
  { kw: ["제니스", "zenith"], h: 300 },
  { kw: ["아이파크", "i-park", "ipark", "i'park"], h: 292 },
  { kw: ["트럼프", "trump", "sk뷰", "sk view"], h: 150 },
];

function parseHeight(tags) {
  if (!tags) return null;
  const name = (tags.name || tags["name:en"] || "").toLowerCase();
  for (const L of LANDMARKS) if (L.kw.some((k) => name.includes(k))) return L.h;
  if (tags.height) {
    const m = parseFloat(String(tags.height).replace(/[^0-9.]/g, ""));
    if (m > 0) return m;
  }
  if (tags["building:levels"]) {
    const l = parseFloat(tags["building:levels"]);
    if (l > 0) return l * 3.3;
  }
  return null;
}

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const buildings = [];
let withTag = 0;

for (const el of raw.elements) {
  if (el.type !== "way" || !el.geometry) continue;
  const g = el.geometry.filter((p) => p.lon >= W && p.lon <= E && p.lat >= S && p.lat <= N);
  if (g.length < 3) continue;
  const pts = g.map((p) => [Math.round(toX(p.lon) * 10) / 10, Math.round(toZ(p.lat) * 10) / 10]);
  // 면적(대략) — 너무 작은 건 스킵
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  area = Math.abs(area) / 2;
  if (area < 12) continue;
  let h = parseHeight(el.tags);
  if (h != null) withTag++;
  else h = area > 1200 ? 24 : area > 400 ? 16 : 9; // 면적 기반 추정
  h = Math.round(Math.min(h, 420) * 10) / 10;
  buildings.push({ pts, h });
}

const out = {
  center: { lon: lonC, lat: latC },
  bbox: [W, S, E, N],
  size: { w: Math.round(sizeW), d: Math.round(sizeD) },
  count: buildings.length,
  withHeightTag: withTag,
  buildings,
};
writeFileSync(OUT, JSON.stringify(out));
console.log(
  `baked ${buildings.length} buildings (heightTag=${withTag}) · scene ${Math.round(sizeW)}×${Math.round(sizeD)}m · ${(JSON.stringify(out).length / 1024).toFixed(0)}KB → ${OUT}`
);
