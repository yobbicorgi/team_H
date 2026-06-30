# app/ — 통합 웹 플랫폼 (Jin · 전체 통합 · UX/UI · 에이전트)

지진해일 수치모델 자동화 플랫폼의 **프론트엔드 통합 앱**. 좌측 파라미터 설정 + 에이전트 채팅, 우측 3D 침수 시각화(Kim `viz/` 슬롯)를 하나로 묶고, 백엔드(Han `backend/`)와 연동한다.

> ⚠️ **현재는 "틀(frame)"입니다.** 실제 모델 파라미터/설정법은 **Han**이, 3D 시뮬레이션은 **Kim**이 각자 폴더에서 만들고, 이후 push/pull로 가져와 이 틀의 placeholder를 실제 기능·비주얼로 **교체·업그레이드**한다. 이 앱은 그 끼울 자리(슬롯)와 데이터 흐름을 먼저 잡아 둔 것.

## ① 무엇을 만들었나 (현재 = 베이스 틀)
- **Next.js 16 + React 19 + TypeScript + Tailwind CSS v4** 앱 골격.
- **디자인 시스템**: 라이트 테마 고정 · **Pretendard** 통일 · 최소 12px · 마린 블루 단일 액센트(뉴트럴 그레이) — *AI 티 나는 디자인 배제(그라데이션/글로우/글래스 없음)*.
- **레이아웃**: 상단바 + 좌측 패널(실험 파라미터 → 시나리오 큐 → 에이전트 채팅) + 우측 3D 뷰 슬롯.
- **파라미터 패널(placeholder)**: 지역/SSP/거리(near·far)/케이스(1–9)/기간/Manning 컨트롤. → **Han이 실제 스키마·설정법으로 교체 예정**.
- **에이전트 채팅**: 자연어 → 좌측 파라미터 자동 설정(데모용 로컬 키워드 파서 `lib/parseIntent.ts`). “모델 실행 X, 셋팅값만” 원칙.
- **시나리오 큐 + Mock 파이프라인**: [시나리오 실행] → 10단계 진행률을 순차 표시(현재 Mock 애니메이션).
- **3D 뷰(placeholder)**: → **Kim `viz/` 모듈이 마운트될 슬롯**(부산권 placeholder + 위치 핀 + 침수심 범례 + MOCK 배지).

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
- [ ] (Han) backend 파라미터 스키마 확정 → `types.ts` 동기화, 폼 검증 추가
- [ ] (Han) Mock 실행 → 실제 `/api/scenarios` 연동(진행 상태 SSE/폴링)
- [ ] (Kim) `VizPanel` placeholder → `viz/` 실제 3D 컴포넌트 마운트
- [ ] (Jin) 에이전트 채팅 로컬 파서 → Claude API function-calling(`set_parameters` 툴)
- [ ] (Jin) 시나리오 비교 뷰, 반응형/접근성 보강

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
