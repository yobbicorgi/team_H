# app/ — 통합 웹 플랫폼 (Jin · 전체 통합 · UX/UI · 에이전트)

지진해일 수치모델 자동화 플랫폼의 **프론트엔드 통합 앱**. 좌측 파라미터 설정 + 에이전트 채팅, 우측 3D 침수 시각화(Kim `viz/` 슬롯)를 하나로 묶고, 백엔드(Han `backend/`)와 연동한다.

> ⚠️ **현재는 "틀(frame)"입니다.** 실제 모델 파라미터/설정법은 **Han**이, 3D 시뮬레이션은 **Kim**이 각자 폴더에서 만들고, 이후 push/pull로 가져와 이 틀의 placeholder를 실제 기능·비주얼로 **교체·업그레이드**한다. 이 앱은 그 끼울 자리(슬롯)와 데이터 흐름을 먼저 잡아 둔 것.

## ① 무엇을 만들었나 (현재 = 베이스 틀)
- **Next.js 16 + React 19 + TypeScript + Tailwind CSS v4** 앱 골격.
- **디자인 시스템(해양 운영 콘솔)**: 라이트 테마 고정 · **Pretendard** + 데이터엔 mono·tabular · 최소 14px · 네이비 잉크 + 마린 블루 단일 액센트 + 침수심 컬러스케일 — *그라데이션/글래스/이모지 배제, 또렷한 대비*. 토큰은 `globals.css` + `submit/assets/DESIGN_TOKENS.md`.
- **레이아웃**: 상단바(상태 카운트 + 전체 자동 실행) + 좌측 패널(**[파라미터]/[에이전트] 탭 전환**) + 우측(**[3D 뷰]/[시나리오 비교] 탭**).
- **파라미터 패널(placeholder)**: 그룹 카드 — 지진원(방향/Mw/케이스) · 해수면상승(SSP/거리/기간) · 영역(지역/Manning). → **Han이 실제 스키마·설정법으로 교체 예정**.
- **두 실행 모드**: ① **단일 실행**(현재 설정 즉시) ② **다중 자동 반복**(큐에 추가 → 전체 자동 실행). 완료 시 Mock 결과(최대 침수심/면적/건물) 부여.
- **에이전트(설정·구성 전용)**: 자연어 → 액션(`set`/`queue`/`run`). 단일 설정, **스윕**(SSP 전부·케이스 1~5·방향 등), **자동 설계**, **일괄 실행**까지. 응답은 **마크다운 표**로 렌더(`react-markdown`). 로컬 파서(`lib/parseIntent.ts`)는 실제 **Claude function-calling**(툴: `AGENT_TOOLS`)으로 교체 예정. “모델 실행 X, 설정·구성만” 원칙.
- **시나리오 큐**: 다중 시나리오 상태/진행/제거, 완료 결과 요약. **시그니처 = 10단계 파이프라인 스테이지 레일**.
- **3D 뷰 / 비교(placeholder)**: → **Kim `viz/` 모듈 마운트 슬롯**(부산 해운대·마린시티, 위치 핀, 침수심 범례, 계기판 베젤). 비교 탭 = 완료 시나리오 결과 small-multiples.

## ② 입력/출력 (인터페이스 — 통합 지점)
- **← backend (Han)**: 파라미터 스키마 JSON, `POST /api/scenarios`(실행/큐), `GET /api/scenarios/:id`(상태·진행·결과). 현재 프론트는 Mock으로 대체 → API 나오면 `AppShell`의 `runScenario`/진행 로직을 교체.
- **→ viz (Kim)**: 선택 시나리오(`Scenario`)와 결과(grid/GeoJSON 침수고)를 `VizPanel`에 전달 → Kim 컴포넌트가 렌더. 결과 포맷 확정 시 `VizPanel` placeholder를 실제 뷰로 교체.
- 타입 정의: `src/lib/types.ts` (스키마가 backend에서 확정되면 동기화).

## ③ 실행법
```bash
cd app
npm install
npm run dev      # http://localhost:3000
# 빌드 검증: npm run build
```
- 의존성: next, react, tailwindcss v4, lucide-react(아이콘), clsx. Pretendard는 layout에서 CDN 로드.

## ④ 남은 일 (TODO — Han·Kim 작업 반영 지점)
- [ ] (Han) backend 파라미터 스키마 확정 → `lib/types.ts` 동기화(현재 placeholder), 폼 검증 추가
- [ ] (Han) Mock 실행 → 실제 `/api/scenarios` 연동(진행 상태 SSE/폴링), 결과 포맷 확정
- [ ] (Kim) `VizPanel` placeholder → `viz/` 실제 3D 컴포넌트 마운트(기대 입력 = grid/GeoJSON 침수고)
- [ ] (Jin) 에이전트 로컬 파서(`parseIntent.ts`) → Claude API function-calling(`AGENT_TOOLS`: set_parameters/queue_scenarios/run)
- [ ] (Jin) 반응형·접근성 보강, 시나리오 비교 정렬/필터

## 구조
```
app/src/
  app/{layout.tsx, page.tsx, globals.css}   # 디자인 토큰·Pretendard·라이트테마
  components/
    AppShell.tsx        # 상태(파라미터·시나리오·선택) + 레이아웃 조립
    TopBar.tsx, ParameterPanel.tsx, ScenarioQueue.tsx, AgentChat.tsx, VizPanel.tsx
    ui.tsx              # Button/Field/Select/Segmented/SectionHeader
  lib/{types.ts, parseIntent.ts}
```
