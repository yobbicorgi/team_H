"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Waves } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
 * ModelMap2D — fort.14 ADCIRC 계산 도메인 · 최대 수위(maxele) 2D 목업 지도
 *
 * 실제 지역 DEM(/twin/region_dem.json)을 읽어 진짜 해안선/수심으로
 * maxele(최대 수위)장을 그린다. 포화된 헤일로가 아니라, 실제 ADCIRC
 * maxele 그림처럼 자연스럽고 매끄럽게:
 *   · 외해는 거의 0 m(짙은 파랑)
 *   · 진원에서 번지는 옅은 동심 ripple
 *   · 실제 해안을 따라서만 얇게 빛나는 cyan→green→(드물게) yellow fringe
 *
 * 레이어
 *   <img>    : 위성 basemap (/twin/region.jpg, DEM과 동일 bbox·픽셀격자)
 *   <canvas> : maxele jet 컬러장 (실제 sea 마스킹 + 도메인 디스크 클립)
 *   <svg>    : 도메인 경계 · 컬러바 · 나침반 · 축척바 · 대상지(부산) 마커
 * ──────────────────────────────────────────────────────────────────────── */

// 모든 prop은 선택 — null이면 합리적 기본값으로 렌더.
export interface ModelMap2DProps {
  scenario?: {
    source?: "SOUTH" | "EAST";
    mw?: number;
    ssp?: string;
    caseNo?: number;
  } | null;
}

type BBox = readonly [number, number, number, number]; // [west, south, east, north]

// region_meta.json / region_dem.json 와 동일한 기본 bbox.
const DEFAULT_BBOX: BBox = [117, 19, 150, 48];

const KM_PER_DEG = 111.32; // 위도 1° 거리(km)

// 계산 도메인(디스크) — 대상지(부산) 중심. bbox 대부분을 덮는 큰 디스크라
// 화면에서는 사실상 점선 경계로만 보인다(필드는 실제 sea로 마스킹).
const TARGET = { lon: 129.045, lat: 35.105 } as const; // mesh center / 대상지(부산)
const DOMAIN_R_DEG = 16;

// 진원 위치(deg). EAST=일본/동해측, SOUTH=대한해협.
const SRC_EAST = { lon: 134.0, lat: 34.0 } as const;
const SRC_SOUTH = { lon: 129.6, lat: 33.4 } as const;

// maxele 컬러바 상한(m).
const FIELD_MAX = 1.0;

// sea 판정 임계(이보다 낮으면 바다).
const SEA_THRESH = 0;

/* ── jet 컬러 램프 ── */
function jetRGB(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  const c = (v: number) => Math.min(1, Math.max(0, v));
  const r = c(1.5 - Math.abs(4 * x - 3));
  const g = c(1.5 - Math.abs(4 * x - 2));
  const b = c(1.5 - Math.abs(4 * x - 1));
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function jet(t: number): string {
  const [r, g, b] = jetRGB(t);
  return `rgb(${r},${g},${b})`;
}

// smoothstep(0..1)
function smooth01(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

// 별 모양 path (진앙 마커용)
function starPath(cx: number, cy: number, rOuter: number, rInner: number, points = 5): string {
  let p = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? rInner : rOuter;
    const a = (Math.PI / points) * i - Math.PI / 2;
    p += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1) + " ";
  }
  return p + "Z";
}

type XY = { x: number; y: number };

type Dem = {
  nx: number;
  ny: number;
  bbox: BBox;
  data: Float32Array; // row0 = North, col0 = West
};

export default function ModelMap2D({ scenario }: ModelMap2DProps) {
  const [dem, setDem] = useState<Dem | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 실제 지역 DEM 로드.
  useEffect(() => {
    let alive = true;
    fetch("/twin/region_dem.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { nx?: number; ny?: number; bbox?: number[]; data?: number[] } | null) => {
        if (!alive || !j?.nx || !j?.ny || !j?.bbox || j.bbox.length !== 4 || !j.data) return;
        setDem({
          nx: j.nx,
          ny: j.ny,
          bbox: [j.bbox[0], j.bbox[1], j.bbox[2], j.bbox[3]] as BBox,
          data: Float32Array.from(j.data),
        });
      })
      .catch(() => {
        /* DEM 없으면 basemap만 표시 */
      });
    return () => {
      alive = false;
    };
  }, []);

  const bbox: BBox = dem?.bbox ?? DEFAULT_BBOX;
  const [west, south, east, north] = bbox;

  // SVG 뷰박스는 basemap(=DEM) 픽셀 격자 종횡비를 따른다 → object-cover 정렬 일치.
  const gx = dem?.nx ?? 420;
  const gy = dem?.ny ?? 442;
  const SVG_W = 1260;
  const SVG_H = (1260 * gy) / gx;

  // 시나리오 기본값.
  const source: "SOUTH" | "EAST" = scenario?.source ?? "EAST";
  const mw = scenario?.mw ?? 7.6;
  const ssp = scenario?.ssp;

  // 진앙 위치 — 방향(동/남) 기준 + 입력 케이스(1~9)에 따라 단층축을 따라 다양화.
  const caseNo = scenario?.caseNo ?? 1;
  const srcBase = source === "SOUTH" ? SRC_SOUTH : SRC_EAST;
  const srcLoc = {
    lon: srcBase.lon + (caseNo - 5) * (source === "SOUTH" ? 0.28 : 0.42),
    lat: srcBase.lat + (caseNo - 5) * (source === "SOUTH" ? -0.12 : 0.16),
  };

  // 진원 강도 계수.
  const mwFactor = Math.min(1.6, Math.max(0.4, 0.6 + (mw - 7.6) * 0.45));

  // 화면 표기용 대략 최대 수위(m).
  const peakDisp = Math.min(1.0, 0.04 + 0.55 * mwFactor + 0.42);

  // lon/lat → SVG 좌표. (동쪽+, 북쪽이 위)
  const lonLatToXY = useMemo(() => {
    return (lon: number, lat: number): XY => {
      const u = (lon - west) / (east - west);
      const v = (north - lat) / (north - south);
      return { x: u * SVG_W, y: v * SVG_H };
    };
  }, [west, south, east, north, SVG_W, SVG_H]);

  // 도메인 경계(도 단위 원 = 화면 타원).
  const domainCenter = lonLatToXY(TARGET.lon, TARGET.lat);
  const domainRx = DOMAIN_R_DEG * (SVG_W / (east - west));
  const domainRy = DOMAIN_R_DEG * (SVG_H / (north - south));

  // 대상지(부산) 마커 · 진앙(추정, 단층 발생 해역) 마커.
  const busan = lonLatToXY(TARGET.lon, TARGET.lat);
  const epi = lonLatToXY(srcLoc.lon, srcLoc.lat);

  /* ── 해안거리(coastKm) BFS — DEM에만 의존, 한 번만 계산 ── */
  const coastKm = useMemo<Float32Array | null>(() => {
    if (!dem) return null;
    const { nx, ny, data } = dem;
    const n = nx * ny;
    const cellKm = ((north - south) * 111) / ny; // ≈ 셀 한 변(km)

    const steps = new Int32Array(n).fill(-1);
    const queue = new Int32Array(n);
    let head = 0;
    let tail = 0;

    // seed: 모든 육지 셀(steps=0)에서 바다 쪽으로 BFS.
    for (let i = 0; i < n; i++) {
      if (data[i] >= SEA_THRESH) {
        steps[i] = 0;
        queue[tail++] = i;
      }
    }
    while (head < tail) {
      const cur = queue[head++];
      const cx = cur % nx;
      const cy = (cur / nx) | 0;
      const s = steps[cur] + 1;
      // 4-이웃
      if (cx > 0) {
        const ni = cur - 1;
        if (steps[ni] === -1 && data[ni] < SEA_THRESH) { steps[ni] = s; queue[tail++] = ni; }
      }
      if (cx < nx - 1) {
        const ni = cur + 1;
        if (steps[ni] === -1 && data[ni] < SEA_THRESH) { steps[ni] = s; queue[tail++] = ni; }
      }
      if (cy > 0) {
        const ni = cur - nx;
        if (steps[ni] === -1 && data[ni] < SEA_THRESH) { steps[ni] = s; queue[tail++] = ni; }
      }
      if (cy < ny - 1) {
        const ni = cur + nx;
        if (steps[ni] === -1 && data[ni] < SEA_THRESH) { steps[ni] = s; queue[tail++] = ni; }
      }
    }

    // km로 변환(가장 가까운 바다 ring → 0 km 에서 시작해 해안 fringe가 또렷).
    const km = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      km[i] = steps[i] > 0 ? (steps[i] - 1) * cellKm : 0;
    }
    return km;
  }, [dem, north, south]);

  /* ── maxele 필드를 캔버스에 렌더(시나리오/DEM 변경 시 재계산) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dem || !coastKm) return;

    const { nx, ny, data } = dem;
    canvas.width = nx;
    canvas.height = ny;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = ctx.createImageData(nx, ny);
    const out = img.data;

    for (let r = 0; r < ny; r++) {
      const lat = north - ((r + 0.5) / ny) * (north - south);
      const kx = KM_PER_DEG * Math.cos((lat * Math.PI) / 180);
      for (let c = 0; c < nx; c++) {
        const cell = r * nx + c;
        const idx = cell * 4;
        const elev = data[cell];

        // 육지 → 완전 투명(위성 그대로).
        if (elev >= SEA_THRESH) {
          out[idx + 3] = 0;
          continue;
        }

        const lon = west + ((c + 0.5) / nx) * (east - west);

        // 도메인 디스크 클립(도 단위 원).
        const dLon = (lon - TARGET.lon) / DOMAIN_R_DEG;
        const dLat = (lat - TARGET.lat) / DOMAIN_R_DEG;
        if (dLon * dLon + dLat * dLat > 1) {
          out[idx + 3] = 0;
          continue;
        }

        // 진원 거리(km).
        const sx = (lon - srcLoc.lon) * kx;
        const sy = (lat - srcLoc.lat) * KM_PER_DEG;
        const distSrcKm = Math.hypot(sx, sy);
        const ck = coastKm[cell];

        // ── maxele(m) ──
        const sourceDecay = 0.55 * Math.exp(-distSrcKm / 520);
        const ripple =
          0.1 * Math.exp(-distSrcKm / 800) * Math.max(0, Math.sin(distSrcKm / 55 - 1.5));
        // 해안 증폭은 진앙에 노출된 연안만(진앙 거리로 게이팅) → 황해·먼 일본 해안은 약화.
        const coastal = 0.42 * Math.exp(-ck / 14) * Math.exp(-distSrcKm / 650);
        let maxele = 0.04 + mwFactor * (sourceDecay + ripple + coastal);
        maxele = Math.min(1, Math.max(0, maxele));

        const [cr, cg, cb] = jetRGB(maxele / FIELD_MAX);
        // 경계에서 alpha를 부드럽게 0으로(깊이 0→-30 m 페더링) → hard edge 제거.
        const feather = smooth01(-elev / 30);
        out[idx] = cr;
        out[idx + 1] = cg;
        out[idx + 2] = cb;
        out[idx + 3] = Math.round(0.72 * feather * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [dem, coastKm, west, south, east, north, srcLoc.lon, srcLoc.lat, mwFactor]);

  // 컬러바 jet 그라디언트(HTML, 좌하단)
  const barGradCss = `linear-gradient(to top, ${Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    return `${jet(t)} ${Math.round(t * 100)}%`;
  }).join(", ")})`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {/* 위성 basemap. object-cover + svg slice 로 정렬 일치. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/twin/region.jpg"
        alt="지역 위성 basemap"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* maxele 필드 — DEM 해상도 캔버스, object-cover 로 basemap 과 정렬. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ imageRendering: "auto" }}
        aria-hidden
      />

      {/* 지오메트리 오버레이(SVG). slice = object-cover 와 동일 정렬. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="fort.14 계산 도메인 · 최대 수위(maxele) 2D 지도"
      >
        {/* (a) 계산 도메인 경계(fort.14) — 큰 점선 타원 */}
        <ellipse
          cx={domainCenter.x}
          cy={domainCenter.y}
          rx={domainRx}
          ry={domainRy}
          fill="none"
          stroke="#dbeafe"
          strokeOpacity={0.85}
          strokeWidth={2.5}
          strokeDasharray="10 6"
        />

        {/* (b) 진앙(추정) 마커 — 단층 발생 해역(별) */}
        <g>
          <circle cx={epi.x} cy={epi.y} r={13} fill="#f59e0b" fillOpacity={0.22} />
          <path d={starPath(epi.x, epi.y, 10, 4.4)} fill="#f59e0b" stroke="#7c2d12" strokeWidth={1.3} />
          <g transform={`translate(${epi.x + 16} ${epi.y + 6})`}>
            <rect x={0} y={-15} width={62} height={25} rx={5} fill="#7c2d12" fillOpacity={0.82} />
            <text x={9} y={3} fill="#ffffff" fontSize={16} fontWeight={600} fontFamily="inherit">진앙</text>
          </g>
        </g>

        {/* (c) 대상지(부산) 마커 */}
        <g>
          <circle cx={busan.x} cy={busan.y} r={8} fill="#ef4444" stroke="#ffffff" strokeWidth={2.5} />
          <g transform={`translate(${busan.x + 14} ${busan.y - 6})`}>
            <rect x={0} y={-18} width={150} height={26} rx={5} fill="#0f172a" fillOpacity={0.78} />
            <text x={10} y={0} fill="#ffffff" fontSize={18} fontWeight={600} fontFamily="inherit">
              대상지(부산)
            </text>
          </g>
        </g>

      </svg>

      {/* 컬러바 (좌하단, HTML — 잘림 없음) */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-2.5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-1 text-[0.8125rem] font-bold text-slate-900">Water Ele. (m)</div>
        <div className="flex items-stretch gap-1.5">
          <div className="h-36 w-5 rounded-sm ring-1 ring-slate-400" style={{ background: barGradCss }} />
          <div className="flex h-36 flex-col justify-between text-[0.75rem] tabular-nums text-slate-700">
            {[1, 0.75, 0.5, 0.25, 0].map((v) => (
              <span key={v}>{(v * FIELD_MAX).toFixed(1)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 나침반 + 축척 (우하단, HTML) */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 rounded-lg bg-white/90 p-2.5 shadow-sm ring-1 ring-slate-200">
        <svg width="56" height="64" viewBox="-30 -34 60 70" aria-hidden>
          <circle cx={0} cy={0} r={25} fill="#ffffff" stroke="#94a3b8" strokeWidth={1} />
          <polygon points="0,-23 6,0 0,5 -6,0" fill="#ef4444" />
          <polygon points="0,23 6,0 0,-5 -6,0" fill="#475569" />
          <text x={0} y={-28} textAnchor="middle" fill="#0f172a" fontSize={12} fontWeight={700}>N</text>
          <text x={0} y={34} textAnchor="middle" fill="#475569" fontSize={11}>S</text>
          <text x={30} y={4} textAnchor="middle" fill="#475569" fontSize={11}>E</text>
          <text x={-30} y={4} textAnchor="middle" fill="#475569" fontSize={11}>W</text>
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-[0.75rem] font-semibold text-slate-800">≈ 200 km</span>
          <span className="mt-0.5 h-[3px] w-20 bg-slate-900" />
        </div>
      </div>

      {/* 우상단 시나리오 배지 */}
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-white/85 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200">
        <Waves className="h-4 w-4 text-blue-600" aria-hidden />
        <span>
          {source === "SOUTH" ? "대한해협(남)" : "동해/일본측(동)"} · Mw {mw.toFixed(1)}
          {ssp ? ` · ${ssp}` : ""} · 최대수위 ≈{peakDisp.toFixed(1)} m
        </span>
      </div>

      {/* 하단 캡션 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-white">
        fort.14 계산 도메인 · 최대 수위(maxele) · 외해 기준
      </div>
    </div>
  );
}
