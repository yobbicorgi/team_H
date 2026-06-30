// OSM Overpass 건물 원본 다운로드 — 공통 bbox 기준.
// 출력: app/osm_raw.json (bake_twin.mjs 입력)
import { writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BBOX } from "./bbox.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "osm_raw.json");
const { W, S, E, N } = BBOX;

// Overpass bbox 순서 = (south,west,north,east)
const q = `[out:json][timeout:180];(way["building"](${S},${W},${N},${E});relation["building"](${S},${W},${N},${E}););out geom;`;

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function run() {
  let lastErr;
  for (const ep of ENDPOINTS) {
    try {
      console.log(`overpass → ${ep}`);
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 180000);
      const res = await fetch(ep, {
        method: "POST",
        body: "data=" + encodeURIComponent(q),
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "team_H-twin/1.0" },
        signal: ac.signal,
      });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const json = JSON.parse(text);
      writeFileSync(OUT, JSON.stringify(json));
      const kb = (statSync(OUT).size / 1024).toFixed(0);
      console.log(`saved ${json.elements?.length ?? 0} elements (${kb} KB) → ${OUT}`);
      return;
    } catch (e) {
      console.log(`  fail: ${e.message}`);
      lastErr = e;
    }
  }
  throw lastErr;
}
await run();
