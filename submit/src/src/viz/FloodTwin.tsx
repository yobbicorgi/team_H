"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { scenarioWaterSpec, type TsunamiScenario } from "@/viz/tsunamiScenarios";

type Size = { w: number; d: number };
type BuildingsData = { size: Size; buildings: { pts: [number, number][]; h: number }[] };
type DemData = { nx: number; ny: number; bbox: number[]; min: number; max: number; data: number[] };
type DemSampler = (x: number, z: number) => number;

// DEM 인코딩 범위(m) — 침수 판정 텍스처용. 지형변위는 dem.json 실값 사용.
const DEM_MIN = -20;
const DEM_MAX = 45;
// 수직 과장(지형·수심·수면 공통). 거대 씬에서 기복 가시화 + 침수심 일관.
const TERRAIN_EXAG = 1.6;

// 월드 (x,z) → DEM 표고/수심(m) bilinear. x:서(-)→동(+), z:북(-)→남(+).
function makeDemSampler(d: DemData, size: Size): DemSampler {
  const { nx, ny, data } = d;
  const hw = size.w / 2, hd = size.d / 2;
  return (x, z) => {
    let fi = ((x + hw) / size.w) * (nx - 1);
    let fj = ((z + hd) / size.d) * (ny - 1);
    fi = fi < 0 ? 0 : fi > nx - 1 ? nx - 1 : fi;
    fj = fj < 0 ? 0 : fj > ny - 1 ? ny - 1 : fj;
    const i0 = Math.floor(fi), j0 = Math.floor(fj);
    const i1 = Math.min(i0 + 1, nx - 1), j1 = Math.min(j0 + 1, ny - 1);
    const tx = fi - i0, tz = fj - j0;
    const v00 = data[j0 * nx + i0], v10 = data[j0 * nx + i1];
    const v01 = data[j1 * nx + i0], v11 = data[j1 * nx + i1];
    const a = v00 + (v10 - v00) * tx, b = v01 + (v11 - v01) * tx;
    return a + (b - a) * tz;
  };
}

// 모두 '도달 가능' 폴백(마스크 준비 전엔 기존 동작 유지)
const WHITE_TEX = (() => {
  const t = new THREE.DataTexture(new Uint8Array([255]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType);
  t.needsUpdate = true;
  return t;
})();

// 지형 차폐 마스크 — 바다에서 flood-fill(BFS)로 '수위 이하 + 바다와 연결'된 셀만 1.
// 산 뒤에 갇힌 저지대(미연결)는 0 → 셰이더에서 침수 제외. (정적: 시나리오 최대수위 기준)
function computeReachTex(dem: DemData, peakLevel: number, seaLevel: number): THREE.DataTexture {
  const { nx, ny, data } = dem;
  const n = nx * ny;
  const reach = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  for (let k = 0; k < n; k++) if (data[k] < seaLevel) { reach[k] = 255; queue[tail++] = k; }
  while (head < tail) {
    const k = queue[head++];
    const i = k % nx, j = (k - i) / nx;
    if (i > 0)      { const m = k - 1;  if (!reach[m] && data[m] < peakLevel) { reach[m] = 255; queue[tail++] = m; } }
    if (i < nx - 1) { const m = k + 1;  if (!reach[m] && data[m] < peakLevel) { reach[m] = 255; queue[tail++] = m; } }
    if (j > 0)      { const m = k - nx; if (!reach[m] && data[m] < peakLevel) { reach[m] = 255; queue[tail++] = m; } }
    if (j < ny - 1) { const m = k + nx; if (!reach[m] && data[m] < peakLevel) { reach[m] = 255; queue[tail++] = m; } }
  }
  if (tail === 0) reach.fill(255); // 바다 시드 못 찾으면 안전하게 전체 허용(회귀 방지)
  const tex = new THREE.DataTexture(reach, nx, ny, THREE.RedFormat, THREE.UnsignedByteType);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/* ───────────── 지면(위성 정사영상 + DEM 지형/수심 변위) ───────────── */
function Ground({ size, sampleDem, exag }: { size: Size; sampleDem: DemSampler; exag: number }) {
  const tex = useLoader(THREE.TextureLoader, "/twin/aerial.jpg");
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
  }, [tex]);
  const geom = useMemo(() => {
    const sx = Math.min(320, Math.max(180, Math.round(size.w / 28)));
    const sz = Math.min(380, Math.max(200, Math.round(size.d / 28)));
    const g = new THREE.PlaneGeometry(size.w, size.d, sx, sz);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, sampleDem(pos.getX(i), pos.getZ(i)) * exag);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [size, sampleDem, exag]);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial map={tex} roughness={1} metalness={0} />
    </mesh>
  );
}

/* ───────────── 건물(OSM footprint 돌출, DEM 지형 위에 안착) ───────────── */
function Buildings({ data, sampleDem, exag }: { data: BuildingsData; sampleDem: DemSampler; exag: number }) {
  const geom = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const b of data.buildings) {
      if (b.pts.length < 3) continue;
      let cx = 0, cz = 0;
      for (const p of b.pts) { cx += p[0]; cz += p[1]; }
      cx /= b.pts.length; cz /= b.pts.length;
      const baseY = Math.max(0, sampleDem(cx, cz)) * exag;
      const shape = new THREE.Shape();
      shape.moveTo(b.pts[0][0], -b.pts[0][1]);
      for (let i = 1; i < b.pts.length; i++) shape.lineTo(b.pts[i][0], -b.pts[i][1]);
      shape.closePath();
      try {
        const g = new THREE.ExtrudeGeometry(shape, { depth: b.h, bevelEnabled: false, steps: 1 });
        g.rotateX(-Math.PI / 2);
        g.translate(0, baseY, 0);
        g.deleteAttribute("uv");
        parts.push(g);
      } catch {
        /* 잘못된 폴리곤 스킵 */
      }
    }
    const merged = parts.length ? mergeGeometries(parts, false) : null;
    if (!merged) return new THREE.BufferGeometry();
    merged.computeVertexNormals();
    return merged;
  }, [data, sampleDem, exag]);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#dfe6ee" roughness={0.62} metalness={0.06} flatShading />
    </mesh>
  );
}

/* ───────────── GPU 물 ─────────────
   외해: 장주기 Gerstner 스웰 + 쓰나미 파면(드로다운→마루→침수→후퇴).
   수직 과장은 지형(TERRAIN_EXAG)과 동일 → 침수 수면이 지형/건물과 정합.
   색: 외해=수심 블루 / 육상=침수심 위험색(범례 동일 스톱). */
const DEM_GLSL = /* glsl */ `
  uniform sampler2D uDem; uniform float uDemMin, uDemMax; uniform vec2 uDemOrigin, uDemSize;
  float sampleGround(vec2 xz){
    vec2 uv = (xz - uDemOrigin) / uDemSize;
    float inside = step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
    float raw = texture2D(uDem, clamp(uv,0.0,1.0)).r;
    float g = uDemMin + raw*(uDemMax-uDemMin);
    return mix(-9999.0, g, inside);
  }
`;

const VERT = /* glsl */ `
  uniform float uTime, uPhase, uSeaExag, uTsuExag, uTerrainExag;
  uniform vec2  uSrcDir;
  uniform float uBaseHeight, uTsunamiAmp, uDrawdownAmp, uFrontStart, uFrontEnd, uCrestWidth, uDrawWidth, uPulses, uSrcDist;
  varying vec3 vWorldPos; varying vec3 vNormal; varying vec2 vWorldXZ; varying float vFrontDist; varying float vEtaReal;
  ${DEM_GLSL}
  const float G = 9.81;
  struct Wave { vec2 dir; float Q; float A; float L; };
  void gerstner(in Wave w, in vec2 p, in float t, inout vec3 disp, inout vec3 nrm){
    vec2 d = normalize(w.dir);
    float k = 6.2831853 / w.L;
    float c = sqrt(G / k);
    float ph = k*dot(d,p) - c*k*t;
    float cf = cos(ph), sf = sin(ph), WA = k*w.A;
    disp.x += w.Q*w.A*d.x*cf; disp.z += w.Q*w.A*d.y*cf; disp.y += w.A*sf;
    nrm.x -= d.x*WA*cf; nrm.z -= d.y*WA*cf; nrm.y -= w.Q*WA*sf;
  }
  float tsunamiProfile(in vec2 p, out float frontDist){
    vec2 dir = normalize(uSrcDir);
    vec2 srcPoint = -dir * uSrcDist;           // 먼 발생원(외해)
    float s = length(p - srcPoint) - uSrcDist;  // 방사거리 → 곡선(부채꼴) 파면
    float ph = clamp(uPhase, 0.0, 1.0);
    float front = mix(uFrontStart, uFrontEnd, ph);
    float d = s - front;                        // <0 외해측, >0 내륙측
    frontDist = d;
    float env = smoothstep(0.0,0.14,ph) * (1.0 - 0.42*smoothstep(0.74,1.0,ph));
    // 선행 드로다운(도달 직전 바다가 빠짐)
    float ahead = smoothstep(0.0,uDrawWidth,d) * (1.0 - smoothstep(uDrawWidth,2.4*uDrawWidth,d));
    float draw = -uDrawdownAmp*1.15*env*ahead;
    // 선두 마루(가파른 앞면) + 후행 파열(wave train)
    float crest = uTsunamiAmp*env*exp(-(d*d)/(2.0*uCrestWidth*uCrestWidth));
    float d2 = d + uCrestWidth*3.2;
    crest += uTsunamiAmp*0.5*env*exp(-(d2*d2)/(2.0*uCrestWidth*uCrestWidth));
    crest *= 0.85 + 0.15*cos(d/max(uCrestWidth,1.0)*uPulses);
    // 후행 침수면 지속(밀려든 물이 채워져 머무름)
    float fill = uTsunamiAmp*0.85*env*smoothstep(0.0,uCrestWidth*1.8,-d)*exp(-max(0.0,-d-uCrestWidth)/(uCrestWidth*9.0));
    return crest + draw + fill;
  }
  void main(){
    vec4 wp = modelMatrix*vec4(position,1.0);
    vec2 p = wp.xz;
    vec3 disp = vec3(0.0); vec3 nrm = vec3(0.0,1.0,0.0);
    gerstner(Wave(vec2( 1.0, 0.25), 0.5,  0.7,  1400.0), p, uTime, disp, nrm);
    gerstner(Wave(vec2( 0.6, 1.0 ), 0.45, 0.4,   760.0), p, uTime, disp, nrm);
    gerstner(Wave(vec2(-0.4, 0.9 ), 0.4,  0.22,  420.0), p, uTime, disp, nrm);
    gerstner(Wave(vec2( 0.9,-0.3 ), 0.35, 0.12,  230.0), p, uTime, disp, nrm);
    float frontDist; float tsu = tsunamiProfile(p, frontDist);
    float swell = disp.y;
    float etaPhys = uBaseHeight + tsu;            // 물리 수면(스웰 제외)

    float ground = sampleGround(p);
    float lm = smoothstep(0.0, 1.5, ground);       // 1=육상, 0=외해
    // 육상: 지형과 동일 과장으로 안착 / 외해: + 스웰·마루 드라마
    float surfY = etaPhys*uTerrainExag + (swell*uSeaExag + tsu*uTsuExag)*(1.0-lm);

    vec3 world = wp.xyz;
    world.x += disp.x*(1.0-lm);
    world.z += disp.z*(1.0-lm);
    world.y  = surfY;

    vWorldPos = world; vWorldXZ = world.xz; vNormal = normalize(nrm);
    vFrontDist = frontDist; vEtaReal = etaPhys;
    gl_Position = projectionMatrix*viewMatrix*vec4(world,1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime, uPeakDepth, uCrestWidth, uBaseHeight;
  uniform vec3 uSkyColor, uHorizonColor;
  uniform sampler2D uReach;
  varying vec3 vWorldPos; varying vec3 vNormal; varying vec2 vWorldXZ; varying float vFrontDist; varying float vEtaReal;
  ${DEM_GLSL}
  float hash21(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    float a=hash21(i),b=hash21(i+vec2(1,0)),c=hash21(i+vec2(0,1)),d=hash21(i+vec2(1,1));
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
  float fbm(vec2 p){ float v=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
    for(int i=0;i<5;i++){ v+=a*vnoise(p); p=m*p; a*=0.5; } return v; }
  vec3 depthRamp(float dm){
    vec3 c0=vec3(0.173,0.498,0.722), c1=vec3(0.498,0.804,0.733), c2=vec3(0.992,0.682,0.380);
    vec3 c3=vec3(0.957,0.427,0.263), c4=vec3(0.843,0.188,0.153), c5=vec3(0.478,0.004,0.467);
    if(dm<0.3) return mix(c0,c1, dm/0.3);
    if(dm<0.5) return mix(c1,c2,(dm-0.3)/0.2);
    if(dm<1.0) return mix(c2,c3,(dm-0.5)/0.5);
    if(dm<2.5) return mix(c3,c4,(dm-1.0)/1.5);
    if(dm<4.0) return mix(c4,c5,(dm-2.5)/1.5);
    return c5;
  }
  void main(){
    float ground = sampleGround(vWorldXZ);
    float eta = vEtaReal;
    float depth = eta - ground;
    if(depth <= 0.02) discard;

    // 지형 차폐(연결성): 바다에서 도달 불가한 셀(산 뒤 저지대)은 침수 제외
    vec2 ruv = clamp((vWorldXZ - uDemOrigin) / uDemSize, 0.0, 1.0);
    float reach = texture2D(uReach, ruv).r;

    // 침수색은 '정상 해수면(uBaseHeight) 위 육지'가 쓰나미로 잠길 때만 — 기본 해수면 잠김은 바다색
    float landMask = smoothstep(uBaseHeight, uBaseHeight + 1.5, ground);
    // 육상인데 바다와 미연결이면 물을 그리지 않음(산이 막아 물이 못 넘어옴)
    if (landMask > 0.5 && reach < 0.4) discard;
    float inund = max(eta - max(ground, uBaseHeight), 0.0) * mix(1.0, reach, landMask);

    vec2 q = vWorldXZ*0.05 + vec2(uTime*0.1,-uTime*0.08);
    float e=0.7, n0=fbm(q);
    float nx=fbm(q+vec2(e,0.0))-n0, nz=fbm(q+vec2(0.0,e))-n0;
    vec3 N = normalize(vNormal + vec3(-nx,0.0,-nz)*1.1);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float fres = mix(0.02, 1.0, pow(1.0-max(dot(N,V),0.0),5.0));
    vec3 sky = mix(uHorizonColor, uSkyColor, clamp(N.y,0.0,1.0));

    float shoal = clamp((ground+25.0)/25.0, 0.0, 1.0);
    vec3 seaCol = mix(vec3(0.02,0.13,0.27), vec3(0.07,0.40,0.56), shoal);
    vec3 floodCol = depthRamp(inund);
    vec3 base = mix(seaCol, floodCol, landMask);

    vec3 Ld = normalize(vec3(0.35,0.85,0.4));
    float spec = pow(max(dot(reflect(-Ld,N),V),0.0), 110.0);
    vec3 col = mix(base, sky, fres*0.45) + spec*0.45;

    // 진행 파면 포말 — 부드럽고 옅게(인공적 흰 띠 완화)
    float frontFoam = (1.0 - smoothstep(0.0, uCrestWidth*1.2, abs(vFrontDist)));
    frontFoam *= 0.32 + 0.4*fbm(vWorldXZ*0.07 + uTime*0.4);
    float shoreFoam = (1.0 - smoothstep(0.0, 0.7, inund)) * landMask;
    shoreFoam *= 0.45 + 0.45*fbm(vWorldXZ*0.18 - uTime*0.4);
    float foam = clamp(max(frontFoam*0.8, shoreFoam), 0.0, 1.0);
    col = mix(col, vec3(0.93,0.96,1.0), foam*0.58);

    float depthN = clamp(inund/uPeakDepth, 0.0, 1.0);
    float landAlpha = mix(0.42, 0.9, depthN);
    float alpha = mix(mix(0.82,0.92,shoal), landAlpha, landMask);
    alpha = max(alpha, foam*0.7);
    gl_FragColor = vec4(col, clamp(alpha,0.0,1.0));
  }
`;

function Water({
  scn, size, dem, reach, timeRef,
}: {
  scn: TsunamiScenario; size: Size; dem: THREE.DataTexture; reach: THREE.DataTexture | null; timeRef: React.MutableRefObject<number>;
}) {
  const geom = useMemo(() => {
    const sx = Math.min(300, Math.max(160, Math.round(size.w / 32)));
    const sz = Math.min(360, Math.max(190, Math.round(size.d / 32)));
    const g = new THREE.PlaneGeometry(size.w, size.d, sx, sz);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [size]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 }, uPhase: { value: 0 },
      uSeaExag: { value: 2.6 }, uTsuExag: { value: 3.6 }, uTerrainExag: { value: TERRAIN_EXAG },
      uSrcDir: { value: new THREE.Vector2(0, -1) }, uSrcDist: { value: 9000 },
      uBaseHeight: { value: 0.8 }, uTsunamiAmp: { value: 4 }, uDrawdownAmp: { value: 1.6 },
      uFrontStart: { value: -5000 }, uFrontEnd: { value: 2000 },
      uCrestWidth: { value: 200 }, uDrawWidth: { value: 260 }, uPulses: { value: 3 }, uPeakDepth: { value: 4 },
      uDem: { value: dem }, uDemMin: { value: DEM_MIN }, uDemMax: { value: DEM_MAX },
      uDemOrigin: { value: new THREE.Vector2(-size.w / 2, -size.d / 2) },
      uDemSize: { value: new THREE.Vector2(size.w, size.d) },
      uSkyColor: { value: new THREE.Color("#d3e6ff") }, uHorizonColor: { value: new THREE.Color("#82a8d0") },
      uReach: { value: WHITE_TEX },
    }),
    [dem, size]
  );

  useEffect(() => {
    const s = scenarioWaterSpec(scn, size.w, size.d);
    uniforms.uSrcDir.value.set(s.srcDir[0], s.srcDir[1]);
    uniforms.uSrcDist.value = s.srcDist;
    uniforms.uBaseHeight.value = s.baseHeight;
    uniforms.uTsunamiAmp.value = s.tsunamiAmp;
    uniforms.uDrawdownAmp.value = s.drawdownAmp;
    uniforms.uCrestWidth.value = s.crestWidth;
    uniforms.uDrawWidth.value = s.drawWidth;
    uniforms.uFrontStart.value = s.frontStart;
    uniforms.uFrontEnd.value = s.frontEnd;
    uniforms.uPeakDepth.value = s.peakDepth;
    uniforms.uPulses.value = s.pulses;
  }, [scn, size, uniforms]);

  useEffect(() => {
    uniforms.uReach.value = reach ?? WHITE_TEX;
  }, [reach, uniforms]);

  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }),
    [uniforms]
  );

  useFrame((_, dt) => {
    uniforms.uTime.value += Math.min(dt, 0.05);
    uniforms.uPhase.value = timeRef.current;
  });

  return <mesh geometry={geom} material={mat} renderOrder={3} frustumCulled={false} />;
}

/* ───────── 카메라: 드래그=시점이동(팬), Ctrl+드래그=회전, 휠=줌 ───────── */
function Controls({ size }: { size: Size }) {
  const ref = useRef<any>(null);
  const { gl } = useThree();
  useEffect(() => {
    const ctl = ref.current;
    if (!ctl) return;
    const { PAN, ROTATE, DOLLY } = THREE.MOUSE;
    ctl.mouseButtons = { LEFT: PAN, MIDDLE: DOLLY, RIGHT: ROTATE };
    const dom = gl.domElement as HTMLElement;
    const onDown = (e: PointerEvent) => {
      const rotate = e.ctrlKey || e.metaKey;
      ctl.mouseButtons.LEFT = rotate ? ROTATE : PAN;
    };
    dom.addEventListener("pointerdown", onDown, true);
    return () => dom.removeEventListener("pointerdown", onDown, true);
  }, [gl]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      target={[0, 30, -size.d * 0.16]}
      maxPolarAngle={Math.PI / 2.06}
      minDistance={500}
      maxDistance={size.d * 1.9}
      screenSpacePanning={false}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

function Scene({
  scn, size, data, dem, reach, sampleDem, timeRef,
}: {
  scn: TsunamiScenario; size: Size; data: BuildingsData; dem: THREE.DataTexture; reach: THREE.DataTexture | null; sampleDem: DemSampler; timeRef: React.MutableRefObject<number>;
}) {
  return (
    <>
      <color attach="background" args={["#dbe6f1"]} />
      <fog attach="fog" args={["#dbe6f1", size.d * 0.95, size.d * 2.5]} />
      <hemisphereLight args={["#ffffff", "#9fb2c6", 1.15]} />
      <directionalLight position={[size.w * 0.4, size.d * 0.7, size.d * 0.3]} intensity={1.25} />
      <Ground size={size} sampleDem={sampleDem} exag={TERRAIN_EXAG} />
      <Buildings data={data} sampleDem={sampleDem} exag={TERRAIN_EXAG} />
      <Water scn={scn} size={size} dem={dem} reach={reach} timeRef={timeRef} />
      <Controls size={size} />
    </>
  );
}

export default function FloodTwin({
  scenario, timeRef,
}: {
  scenario: TsunamiScenario; timeRef: React.MutableRefObject<number>;
}) {
  const [data, setData] = useState<BuildingsData | null>(null);
  const [demRaw, setDemRaw] = useState<DemData | null>(null);
  const [dem, setDem] = useState<THREE.DataTexture | null>(null);
  const [reachTex, setReachTex] = useState<THREE.DataTexture | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    Promise.all([
      fetch("/twin/buildings.json").then((r) => r.json()),
      fetch("/twin/dem.json").then((r) => r.json()),
    ])
      .then(([b, d]: [BuildingsData, DemData]) => {
        if (!on) return;
        setData(b);
        setDemRaw(d);
        const n = d.nx * d.ny;
        const arr = new Uint8Array(n);
        const range = DEM_MAX - DEM_MIN;
        for (let k = 0; k < n; k++) {
          let e = d.data[k];
          if (e < DEM_MIN) e = DEM_MIN; else if (e > DEM_MAX) e = DEM_MAX;
          arr[k] = Math.round(((e - DEM_MIN) / range) * 255);
        }
        const tex = new THREE.DataTexture(arr, d.nx, d.ny, THREE.RedFormat, THREE.UnsignedByteType);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        setDem(tex);
      })
      .catch(() => on && setErr("트윈 데이터 로딩 실패"));
    return () => { on = false; };
  }, []);

  const sampleDem = useMemo(
    () => (demRaw && data ? makeDemSampler(demRaw, data.size) : null),
    [demRaw, data]
  );

  // 시나리오 최대수위 기준 지형 차폐(연결성) 마스크 — 시나리오 바뀌면 재계산
  useEffect(() => {
    if (!demRaw || !data) return;
    const spec = scenarioWaterSpec(scenario, data.size.w, data.size.d);
    const tex = computeReachTex(demRaw, spec.baseHeight + spec.tsunamiAmp * 1.05, spec.baseHeight);
    setReachTex(tex);
    return () => tex.dispose();
  }, [demRaw, data, scenario]);

  if (err)
    return <div className="flex h-full items-center justify-center bg-[#dbe6f1] text-[0.875rem] text-muted">{err}</div>;
  if (!data || !dem || !sampleDem)
    return <div className="flex h-full items-center justify-center bg-[#dbe6f1] text-[0.875rem] text-muted">3D 씬 로딩 중…</div>;

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [data.size.w * 0.08, data.size.d * 0.34, data.size.d * 0.6], fov: 42, near: 1, far: data.size.d * 2.8 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
    >
      <Suspense fallback={null}>
        <Scene scn={scenario} size={data.size} data={data} dem={dem} reach={reachTex} sampleDem={sampleDem} timeRef={timeRef} />
      </Suspense>
    </Canvas>
  );
}
