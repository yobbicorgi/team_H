# 디자인 토큰 · 가이드 (teamH 콘솔 — 재사용 자산)

> 작성: Jin. 서브에이전트 2개 웹 리서치(전문 콘솔 UI / 해양·침수심 팔레트) 결과를 종합한 디자인 시스템.
> 컨셉: **예보사업부 지진해일 운영/연구 콘솔** — 일반 SaaS가 아니라 해양·계측기 톤. 라이트 테마 고정 · Pretendard · 최소 14px.
> 실제 구현: `app/src/app/globals.css`(@theme 토큰) + `app/src/components/ui.tsx`.

## 핵심 원칙 (흐림 방지)
"흐리멍텅함 = 회색 텍스트 + 안 보이는 보더 + 그라데이션/글래스." 또렷함은 그 반대:
1. **네이비 잉크** — 본문은 회색 금지(`#243B53` 이상, ≈11:1). 강조는 색이 아니라 더 진한 잉크·굵은 weight.
2. **보이는 보더** — 컨트롤 외곽 `#8497A8`(비텍스트 3:1). slate-200급 금지.
3. **단일 액센트** — 마린 블루 `#0E76C4` 하나. 시안 `#06B6D4`는 '라이브/활성'에만.
4. **솔리드 채움** — 버튼/활성 세그먼트는 단색. 그라데이션·글래스·보라 금지.
5. **계측기 타이포** — 숫자·코드·좌표·규모는 `font-mono` + `tabular-nums`.
6. 상태 배지 = 연한 배경 + **진한 텍스트(-700)** + 1px ring + 솔리드 dot. solid는 '라이브'만.

## 컬러 토큰 (globals.css `@theme`)
```
표면   canvas #F4F7FA · panel #FFFFFF · panel-2 #EEF3F7
보더   border #D2DCE4 · border-strong #8497A8
잉크   ink #0A2540(제목) · ink-2 #243B53(본문) · muted #486581 · faint #6B7C8E
액센트 accent #0E76C4 · accent-hover #0A5A9C · accent-soft #E1EFF9 · cyan #06B6D4(라이브)
상태   ok #047857/소프트 #ECFDF5/링 #A7F3D0 · warn #B5650A/#FFFBEB/#FDE68A · danger #B91C1C/#FEF2F2/#FECACA
```

## 침수심(Inundation Depth) 스케일 (0 → ≥4m, 라이트 튜닝)
```
#d8eef7 · #a9d6ec · #6fb8de · #3a90c8 · #1f63a6 · #163e7a · #0d2a5c
```
- 검증된 ColorBrewer Blues 계열을 라이트 배경 가독성에 맞게 튜닝. 침수심=면 채움(블루), 위험/경보=윤곽·배지(앰버→레드)로 채널 분리.

## 컴포넌트 규칙
- **버튼**: primary = 솔리드 `accent` + 흰 텍스트 + `font-semibold` + 작은 그림자. outline = 흰 배경 + `border-strong` + `ink-2` 텍스트. ghost = 투명 + hover `panel-2`.
- **세그먼트**: 활성 = 솔리드 accent + 흰 텍스트(또렷). 비활성 = muted.
- **배지**: soft(연배경+진텍스트+ring+dot) 기본, live(솔리드 accent+시안 dot pulse).
- **select/input**: `border-strong` 외곽, focus 시 accent ring 2px.
- radius: 버튼/입력 8–10px(`rounded-lg`), 카드 12px(`rounded-xl`). pill은 칩/dot만.
- 그림자: `0 1px 3px rgba(10,37,64,.08~.10)` 1단계만(컬러 글로우 금지).

## 도메인 모티프 (절제 사용)
- 그래티큘(위경도 격자) 지도 뒤 `#cdd9e3`.
- 계기판 베젤 = 캔버스 네 모서리 L자 등록마크(`border-strong`).
- 시그니처 = **10단계 파이프라인 스테이지 레일**(01→10, 수행 시 순차 점등) — 수작업 10단계 자동화의 상징.

## 타이포
- UI: **Pretendard**(가변, CDN). 데이터: mono(JetBrains Mono → 시스템 폴백) + `tabular-nums`.
- 최소 14px. 본문 15px, 라벨/캡션 14px, 제목 16px.

## 참고(리서치 출처 일부)
Linear/Vercel(Geist)·Carbon 콘솔 미감, Radix Colors, ColorBrewer, cmocean(해양 colormap), NOAA 침수/SLR 뷰어, WCAG 1.4.3/1.4.11.
