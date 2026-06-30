// 트윈 매니페스트 — aerial·DEM·buildings 공통 bbox/투영 메타를 한 파일로.
// 프론트(FloodTwin)가 좌표·크기 정합 기준으로 읽는다.
// 출력: app/public/twin/manifest.json
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BBOX, derive } from "./bbox.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public/twin/manifest.json");
const { W, S, E, N } = BBOX;
const d = derive();

const out = {
  bbox: [W, S, E, N],
  center: { lon: d.lonC, lat: d.latC },
  size: { w: d.sizeW, d: d.sizeD }, // 씬 미터 (동서 × 남북)
  mPerDegLon: Math.round(d.mPerLon * 100) / 100,
  mPerDegLat: d.mPerLat,
  projection: "equirectangular(lon/lat 선형) · x=동(+) z=남(+) · 북=-z",
  layers: {
    aerial: "public/twin/aerial.jpg (ESRI World Imagery)",
    dem: "public/twin/dem.json (AWS Terrarium, 표고+수심)",
    buildings: "public/twin/buildings.json (OSM Overpass)",
  },
  note: "세 레이어 모두 동일 bbox·동일 등각투영으로 베이크 → 위성/지형/건물 정합",
};
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`manifest → ${OUT}\n  bbox=[${W},${S},${E},${N}] size=${d.sizeW}x${d.sizeD}m`);
