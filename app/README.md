# app/ — 통합 웹 플랫폼 (Jin · 전체 통합 · UX/UI · 에이전트 · 디지털트윈)

지진해일 수치모델 자동화 플랫폼의 **통합 웹 앱**. 좌측에서 파라미터를 설정(또는 에이전트 채팅)하고, 우측에서 **부산 해운대권 3D 디지털트윈 침수 시뮬레이션 / 2D 모델맵 / 시나리오 비교**를 본다. (Next.js 16 + React 19 + TypeScript + Tailwind v4 + three.js)

## 실행 (어느 PC에서든 git clone 후)
```bash
cd app
npm install
npm run dev          # http://localhost:3000
```
- 시각화에 필요한 데이터(`public/twin/*.json`, `*.jpg`)는 **저장소에 포함**되어 있어 추가 작업 없이 바로 실행된다.
- (선택) 데이터 재생성: `npm run data:all` — ESRI World Imagery(위성)·AWS Terrarium(표고/수심)·OSM Overpass(건물)를 동일 bbox로 다시 베이크한다(`sharp` 사용, devDependency).

## 주요 기능 (구현됨)
- **좌측 — 파라미터 / 에이전트 탭**
  - 파라미터: 지진원(방향·Mw·케이스) · 해수면상승(SSP·분석기간) · 영역(지역·Manning) · 고급설정(ADCIRC·STEP). 실행 = 즉시 실행 / 큐에 추가 / 전체 큐 실행(순차).
  - 에이전트: 자연어 → 파라미터 설정·다중 시나리오 스윕을 **시나리오 큐에 자동 추가**(마크다운 표로 응답). `lib/parseIntent.ts`(로컬 파서, Claude function-calling 교체 지점).
- **우측 — 3D 뷰 / 2D 모델맵 / 시나리오 비교 탭**
  - **3D 디지털트윈**(`FloodTwin.tsx`): 위성 정사영상 + **실측 DEM 지형/수심 기복** + OSM 건물 + **GPU 물 셰이더**(다중 Gerstner 스웰 + 곡선(부채꼴) 쓰나미 파면). 침수는 **실제 DEM에서 η>지반고**로 판정하고 **침수심별 위험색**으로 표기(외해=수심 블루). 침수색은 쓰나미로 정상 해수면 위 육지가 잠길 때만 표시. 재생 타임라인.
  - **2D 모델맵**(`ModelMap2D.tsx`): 지역 위성 + 실측 지역 DEM 마스크 기반 **최대 수위(maxele) 필드** + fort.14 계산 도메인 경계 · 진앙 · 대상지(부산) 마커.
  - **시나리오 비교**: 완료 시나리오의 최대 침수심·면적·영향 건물 small-multiples.
  - 카메라 조작: 드래그=시점이동 · Ctrl+드래그=회전 · 휠=줌.
- **상단바**: 큐 상태(대기/실행/완료) · 전체 자동 실행. 수치모델 진행은 **비차단 배지**로 표시(작업 계속 가능).

## 구조
```
src/
  components/  AppShell · TopBar · ParameterPanel · AgentChat · ScenarioQueue
               VizPanel · FloodTwin(3D) · ModelMap2D(2D) · StageRail · ui
  lib/         types.ts · tsunamiScenarios.ts(시나리오→셰이더 파라미터) · parseIntent.ts
scripts/       bbox.mjs(공통 bbox) · fetch_osm · bake_aerial · bake_dem · bake_twin
               · bake_region · bake_manifest  (npm run data:* 로 재현)
public/twin/   aerial.jpg · dem.json · buildings.json · region.jpg · region_dem.json · manifest.json
```

## 통합 지점 (← backend / → viz)
- **← backend (Han)**: 파라미터 스키마 / `POST·GET /api/scenarios`(실행·상태·결과 GeoJSON). 현재 데모는 Mock 파이프라인(`AppShell`의 진행 로직)으로 대체 — 실제 API 연결 시 교체.
- **→ viz (Kim)**: 3D 시각화 역할. 본 앱의 `FloodTwin`/`ModelMap2D`는 Kim의 viz 시각화(위성·DEM·건물 정합, 침수 표현)를 app에 통합한 결과물이며, Kim `viz/`의 목업 데이터·3D PoC와 연계된다.

## 검증
- TypeScript(`tsc --noEmit`) 통과 · Playwright 전기능 동작 테스트(좌측 탭/파라미터/실행·큐/3D·2D·비교 전환/시나리오 선택/재생/에이전트) **콘솔에러 0**.
- 타입 정의는 `src/lib/types.ts`(backend 스키마 확정 시 동기화).
