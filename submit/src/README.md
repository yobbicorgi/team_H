# src/ — 부산 지진해일 디지털트윈 통합 웹 플랫폼 (Jin · 통합 · UX/UI · 에이전트)

지진해일 수치모델 자동화 플랫폼의 **통합 웹 앱**. 좌측에서 파라미터를 설정(또는 에이전트 채팅)하고, 우측에서 **부산 해운대권 3D 디지털트윈 침수 시뮬레이션 / 2D 최대수위(maxele) 모델맵**을 본다. (Next.js 16 + React 19 + TypeScript + Tailwind v4 + three.js)

> **이 `src` 폴더만 있으면 어느 PC(macOS·Windows 모두)에서도 구동**됩니다. 지도·DEM·건물 등 필요한 데이터가 `public/twin/`에 포함되어 있습니다.

## 빠른 시작 (설치·실행)
```bash
# 사전 준비: Node.js >= 20.9 (https://nodejs.org)  · macOS / Windows 공통
cd src
npm install          # 필요한 패키지 일괄 설치 (requirements.txt 참고)
npm run dev          # → http://localhost:3000
```
- 필요한 패키지 목록·설치 안내는 **`requirements.txt`** 참고(실제 설치는 `npm install` 한 줄).
- 시각화 데이터(`public/twin/*.json`, `*.jpg`)는 **저장소에 포함** — 추가 작업 없이 바로 실행.
- (선택) 데이터 재생성: `npm run data:all` — ESRI 위성·AWS Terrarium 표고/수심·OSM 건물을 동일 bbox로 재베이크(`sharp`, devDependency).

## 주요 기능
- **좌측 — 파라미터 / 에이전트 탭**
  - 파라미터: 지진원(방향·Mw·케이스) · 해수면상승(SSP·분석기간) · 영역(지역·Manning) · 고급설정(ADCIRC·STEP). 실행 = 즉시 실행 / 큐에 추가 / 전체 큐 실행(순차).
  - **시나리오 큐**: 큐가 길어지면 큐 내부 스크롤로 처리되어 좌패널이 무한정 늘어나지 않음.
  - 에이전트: 자연어 → 파라미터 설정·다중 시나리오 스윕을 **큐에 자동 추가**(마크다운 표). 대충 말해도 의도를 추측하고 **“이걸 원하셨나요?”로 되묻는 유연 모드** + 빠른 예시 칩. `lib/parseIntent.ts`(로컬 파서, Claude function-calling 교체 지점).
- **우측 — 3D 뷰 / 2D 모델맵 탭** (결과는 **시나리오를 실행(완료)한 뒤에만** 표출 — 시연 타이밍)
  - **3D 디지털트윈**(`viz/FloodTwin.tsx`): 위성 정사영상 + 실측 DEM 지형/수심 기복 + OSM 건물 + **GPU 물 셰이더**(다중 Gerstner 스웰 + 곡선(부채꼴) 쓰나미 파면). 침수는 실제 DEM에서 η>지반고로 판정하고 침수심별 위험색으로 표기. 재생 타임라인.
  - **2D 모델맵**(`viz/ModelMap2D.tsx`): 지역 위성 + 실측 DEM 마스크 기반 **최대 수위(maxele) 필드** + 계산 도메인 경계 · 진앙 · 대상지 마커.
  - 카메라: 드래그=시점이동 · Ctrl+드래그=회전 · 휠=줌.
- **상단바**: 큐 상태(대기/실행/완료) · 전체 자동 실행. 수치모델 진행은 **비차단 배지**.
- **시나리오 영속 저장**: 생성·실행한 시나리오는 `database/scenarios.json`에 자동 저장되어 **새로고침해도 유지**(각 사용자 폴더에 생성, git 미포함). 서버 라우트를 못 쓰면 `localStorage`로 폴백.

## 구조
```
src/
  app/         layout · page · api/scenarios(route.ts — 시나리오 영속 저장 API)
  components/  AppShell · TopBar · ParameterPanel · AgentChat · ScenarioQueue · VizPanel · StageRail · LoadingOverlay · ui
  viz/         FloodTwin(3D) · ModelMap2D(2D) · tsunamiScenarios(시나리오→셰이더 파라미터)
  backend/     types.ts(파라미터/결과 스키마)
  lib/         parseIntent.ts(에이전트 파서) · scenarioStore.ts(영속 저장 클라이언트)
scripts/       bbox · fetch_osm · bake_aerial · bake_dem · bake_twin · bake_region · bake_manifest (npm run data:*)
public/twin/   aerial.jpg · dem.json · buildings.json · region.jpg · region_dem.json · manifest.json · region_meta.json
database/      scenarios.json (런타임 자동 생성 — 개인 실험, git 제외)
```

## 통합 지점 (← backend / → viz)
- **← backend (Han)**: 파라미터 스키마 / `POST·GET /api/scenarios`(실행·상태·결과 GeoJSON). 현재 데모는 Mock 파이프라인(`AppShell`)으로 대체 — 실제 API 연결 시 교체.
- **→ viz (Kim)**: 본 앱의 `viz/FloodTwin`·`viz/ModelMap2D`는 Kim viz 시각화(위성·DEM·건물 정합, 침수 표현)를 app에 통합한 결과물이며 Kim `viz/`의 목업·3D PoC와 연계.

## 검증
- TypeScript(`tsc --noEmit`) 통과 · Playwright 전기능 동작 테스트(좌측 탭/파라미터/실행·큐/3D·2D 전환/시나리오 선택/재생/에이전트) **콘솔에러 0**.
