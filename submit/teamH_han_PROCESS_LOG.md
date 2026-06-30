# PROCESS_LOG — 작업 기록 (과정 70점의 핵심 근거)

> 표준 헤더(CLAUDE.md 등)를 로드했다면 에이전트가 알아서 채워 줍니다. 비면 직접 채우세요.
> 원칙: **실제로 시킨 프롬프트를 그대로 인용**할 것. 요약만 있으면 점수가 깎입니다.

## 작성자 정보 (개인별 로그 — 본인 것만)
- 팀명: teamH
- 본인 이름(작성자): han
- 공통과제(우리 팀이 자동화한 반복 수작업): 지진해일 수치모델(ADCIRC+SWAN) 수행을 위한 10단계 전처리·실행준비 과정 자동화. 기존에는 작업자가 01_Deform_Plane~10_SLR_RUN 각 폴더에 직접 들어가 파일·코드·파라미터를 수동으로 수정하고 순차 실행하는 단순 반복 작업이었음.
- 내가 맡은 부분: 백엔드 / 수치모델 파이프라인·파라미터 (backend/). 파라미터 스키마 정의, 10단계 Config 자동 생성, Mock 파이프라인 오케스트레이션, REST API, 결과 GeoJSON 포맷 산출, 프론트(Jin)·시각화(Kim) 데이터 연결.
- 자유과제(있으면): Day2에 실제 전처리 스크립트(01~05) 연결 예정

> **이 로그는 본인 것만 작성**합니다. 각자 자기 PC·계정으로 작업해 개인 로그를 남기고, 제출 시 **영문 파일명** `<팀영문명>_<이름로마자>_PROCESS_LOG.md`(예: `teamA_kim_PROCESS_LOG.md`)로 저장하세요. **한글 파일명은 압축 시 깨지므로 금지** — 한글 팀명·이름은 위 '작성자 정보'에 적습니다. 운영자가 팀별로 모아 채점합니다(전원 참여 = 팀별 개인 로그 수).

## 효과 측정 (Before → After, 결과 ⑥ 채점용 — 형식 자유)

> **핵심**: 기존에는 10단계 폴더마다 들어가 **특정 변수(단층 케이스·SSP·기간·해상도 등)를 직접 바꿔** 실행해야 했지만, 지금은 **웹 플랫폼 GUI에서 변수를 설정**하거나 **에이전트에게 자연어로 변수 설정을 맡겨** 동일 작업을 한다. 수치모델 수행(계산) 시간 자체는 동일해 시간을 정량적으로 단축했다고 단정하긴 어렵지만, **이 방식 전환으로 폴더별 반복 수작업이 사라져 훨씬 효율적**이다. (정성 위주)

| 지표 | Before (수작업) | After (에이전트화) | 효과 |
|------|--------|-------|------|
| **케이스 전환 절차** | 단계 폴더 10개를 하나하나 들어가 파일·경로·케이스번호를 직접 열어 수정하고 순차 실행 | 파라미터 1개만 바꾸면 전 단계 설정에 자동 반영 | 폴더별 수동 반복 제거 |
| **파라미터·변수 설정** | 스크립트/텍스트 파일을 직접 편집(유효값을 알아야 하고 오기입 위험) | 좌측 폼·에이전트 채팅으로 설정(검증 포함) | 설정 간소화·실수↓ |
| **다중 시나리오 생성** | 케이스마다 작업자가 직접 값을 바꿔 반복 수행 | 여러 시나리오를 큐에 자동 생성 → 순차 자동수행 | 반복 작업 자동화 |
| **데이터 시각화 고도화** | 단계 폴더에 흩어진 수치/격자 파일을 수동 수집·해석 | 부산 디지털트윈 3D 침수(침수심별 색)·2D 최대수위(maxele)를 한 화면에서 | 결과 이해·비교 직관화 |

> 위 4개 지표는 팀 공통 `submit/BEFORE_AFTER.md`와 동일하다(개인 로그·공통 문서 일관성 유지).

### 백엔드 세부 지표 (참고 — Han 담당 영역)

| 지표 | Before (기존 수작업) | After (에이전트 자동화) |
|------|------|------|
| 케이스 전환 절차 | 10개 폴더 진입 후 파일명·경로 수동 수정 | 파라미터 1개 변경 → 전체 자동 반영 |
| fort.14 격자 생성 | SMS 툴에서 수동 클릭·설정 (수십 분) | 지역명 입력 → 5-Zone 격자 자동 생성 (수초) |
| fort.15 파라미터 수정 | 텍스트 파일 직접 편집, 오타 가능 | 채팅 한 줄 입력 → Pydantic 스키마 검증 후 반영 |
| SSP×기간 시나리오 조합 | 파일 복사·이름 변경 반복 (SOUTH 144케이스) | API 파라미터 자동 조합, 전 케이스 일괄 처리 |
| 입력값 오류 탐지 | 모델 실행 후 결과 확인 시 발견 | 스키마 사전 검증으로 실행 전 차단 |
| 비전문가 접근성 | ADCIRC·SMS 전문 지식 필수 | 채팅 UI로 파라미터 입력 및 결과 확인 가능 |
| 결과 포맷 통일 | 담당자마다 출력 형식 상이 | GeoJSON 표준 포맷 자동 산출, 팀 전체 공유 가능 |
| 팀원 간 데이터 연결 | 이메일·메신저로 파일 수동 전달 | REST API 1개로 프론트·시각화 팀 동시 연결 |

※ 모델 수행(계산) 시간 자체는 동일 — 준비·설정·루틴 반복 작업 제거가 핵심

## 사용 기법 (권장·가점, 필수 아님)
- [x] (a) 서브에이전트 / 역할 분담 — Explore 에이전트 병렬 분석, GRID_AGENT·SCENARIO_AGENT 역할 분담 문서
- [x] (b) 외부 도구·데이터 연동 — /Desktop/AI,AX 실제 스크립트, Deform_plane_ALL_NEW.xlsx Excel 케이스 데이터 직접 연동
- [x] (c) 재사용 산출물 — subagents/GRID_AGENT.md, subagents/SCENARIO_AGENT.md, compat.py 호환 레이어, grid_validator.py 검증 툴

---

## 작업 로그 (단계마다 1개씩 누적 / 시간순)

---

### [#1] 해커톤 환경 세팅 및 제출 폴더 구조 확인
- 작성자(팀원): han
- 목표: CLAUDE.md 규칙 로드, submit/ 폴더 구조 파악, 개인 로그 파일명 확정
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "조건들 읽어보고 환경 세팅을 부탁해. 그리고 나한테 질문해야할 정보들 말해주면 알려줄게"
- 사용한 기법(있으면): -
- 결과: CLAUDE.md 채점 기준(과정 70:결과 30) 확인. submit/ 폴더 구조(PROCESS_LOG, BEFORE_AFTER, assets/, evidence/) 파악. 개인 로그 파일명 `teamH_han_PROCESS_LOG.md` 확정. 작성자 정보 기입(팀명 teamH, 담당: 백엔드 파이프라인)
- 막힘 → 해결: 공통과제 내용은 팀 회의 후 확정 → GitHub 공유 후 보완 예정

---

### [#2] Git 브랜치 구조 파악 및 역할 분담 확인
- 작성자(팀원): han
- 목표: main 브랜치 pull 후 팀 전체 역할 분담 구조(Jin-프론트/Kim-시각화/Han-백엔드) 파악, 본인 업무 범위 정의
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "main 브렌치에서 수정내용 pull 해서 업무 분석해주고 내가 해야할 업무에 대해서 정리해줘"
- 사용한 기법(있으면): -
- 결과: origin/main pull 완료. Jin(Next.js 프론트), Kim(3D 시각화 viz/), Han(backend/ 파이프라인) 역할 확정. Han 업무 범위: ScenarioParams 스키마, 10단계 Config 자동 생성, REST API, 결과 GeoJSON. Han 브랜치 생성 및 작업 시작
- 막힘 → 해결: 없음

---

### [#3] AI,AX 10단계 스크립트 분석 — 01~05단계 (전처리 전반부)
- 작성자(팀원): han
- 목표: /Desktop/AI,AX 폴더 내 01_Deform_Plane~05_fort13 스크립트의 입력 파라미터·출력물·의존관계 분석
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "/Desktop 에 AI,AX 폴더가 있는데 이거를 우리의 작전에 맞게 업무를 자동화하고 결과 표출까지 가능하도록 수행할건데, 이 각각의 파일에서 자동화 또는 gui화 할 때 필요한 input이 무엇인지 어떻게 정리하면 좋을지 정리해서 알려줘"
- 사용한 기법(있으면): (a 서브에이전트 — Explore 에이전트로 01~05 병렬 분석)
- 결과: 01 Deform_Plane(단층파라미터 Mw/주향/경사/rake), 02 Tsu_xyz(격자 좌표 변환), 03 fort14(격자 생성 핵심 파라미터), 04 MSL_to_AHHW(해수면 기준 변환), 05 fort13(Manning 계수 설정) 파라미터 목록 추출. 자동화 가능 입력 5개 확정(지역명, 단층케이스번호, 격자해상도, 해수면기준, Manning모드)
- 막힘 → 해결: 없음

---

### [#4] AI,AX 10단계 스크립트 분석 — 06~10단계 (실행 후반부)
- 작성자(팀원): han
- 목표: 06_AHHW_RUN~10_SLR_RUN 스크립트의 SSP 시나리오·SLR 파라미터·결과 출력 구조 분석
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "/Desktop 에 AI,AX 폴더가 있는데 [...] 각각의 파일에서 자동화 또는 gui화 할 때 필요한 input이 무엇인지 어떻게 정리하면 좋을지 정리해서 알려줘"
- 사용한 기법(있으면): (a 서브에이전트 — Explore 에이전트로 06~10 병렬 분석)
- 결과: 06 AHHW_RUN(ADCIRC 실행 제어), 07 SLR_Scenario(SSP2.6/4.5/7.0/8.5 × near/mid/long/far 조합), 08 Tsu_SLR_fort14(침수+SLR 복합 격자), 09 AHHW_to_SLR(기준 변환), 10 SLR_RUN(최종 모의 실행) 분석 완료. GUI 핵심 입력 7개 항목 확정(지역/SSP/fort14/CASE/MSL대표점/near·far/시간범위)
- 막힘 → 해결: 없음

---

### [#5] Pydantic 파라미터 스키마 설계 (ScenarioParams)
- 작성자(팀원): han
- 목표: 10단계 전처리에서 추출한 입력 파라미터를 Pydantic v2 스키마로 정의, 타입 검증 및 기본값 설정
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "해당 사항 수행하는데 나에게 물어볼 사항 있으면 질문하고 구체적으로 모르겠으면 질문해주고 main에서 할당된 부분을 수행해줘"
- 사용한 기법(있으면): (b 도구연동 — AI,AX 스크립트 분석 결과 직접 반영)
- 결과: `backend/schemas/params.py` 생성. ScenarioParams(region, sea_area, ssp, distance, earthquake_cases, manningMode), MslPoint(lon/lat/msl_m) 스키마 정의. Pydantic v2 Field 검증(ssp Literal, distance Literal, cases 범위 제한). 기본값: ssp="8.5", distance="near", cases=[1]
- 막힘 → 해결: 없음

---

### [#6] 10단계 Config 자동 생성 및 파이프라인 오케스트레이터 구현
- 작성자(팀원): han
- 목표: ScenarioParams 입력 → 10단계 각 스텝 Config dict 자동 생성(_build_config), 파이프라인 순차 실행 오케스트레이터(engine.py) 구현
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "해당 사항 수행하는데 나에게 물어볼 사항 있으면 질문하고 구체적으로 모르겠으면 질문해주고 main에서 할당된 부분을 수행해줘"
- 사용한 기법(있으면): (b 도구연동 — AI,AX 실제 스크립트 파라미터 구조 반영)
- 결과: `backend/pipeline/engine.py` 구현. `run_pipeline(params)`: 10단계 순차 실행, 단계별 상태(pending→running→done) 추적, 결과 dict 반환. `_build_config(params, step)`: 스텝별 Config 자동 생성(지역명→좌표, SSP→SLR값, CASE→단층파라미터 자동 매핑). end-to-end 2 CASE 테스트 통과 (22단계 완료)
- 막힘 → 해결: 없음

---

### [#7] Mock 어댑터 구현 및 FastAPI REST API 구축
- 작성자(팀원): han
- 목표: 실제 ADCIRC 실행 없이 물리적으로 그럴듯한 Mock 결과 생성, REST API 엔드포인트 구축
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "해당 사항 수행하는데 나에게 물어볼 사항 있으면 질문하고 구체적으로 모르겠으면 질문해주고 main에서 할당된 부분을 수행해줘"
- 사용한 기법(있으면): -
- 결과: `backend/pipeline/mock_adapter.py`: 케이스별 침수 GeoJSON(400노드) 생성, SSP별 SLR값 테이블 적용. `backend/api/scenarios.py`: POST /api/scenarios(실행), GET /api/scenarios/{id}(상태조회), DELETE /api/scenarios/{id}(삭제). `main.py`: CORS 전체 허용(Jin/Kim 연동 대비), uvicorn 실행. `backend/README.md` 작성
- 막힘 → 해결: 없음

---

### [#8] fort.15 ADCIRC 제어파라미터 스키마 설계
- 작성자(팀원): han
- 목표: ADCIRC fort.15 파일 표준 구조 분석 → 사용자가 채팅으로 변경 가능한 파라미터 스키마 정의
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "사용자가 인풋 파라미터 뭐 fort.15에 들어가는 fort.63 뽑는 간격을 1분단위 1시간단위 등등으로 바꾼다던지 fort.61 데이터 위치를 바꾼다던지 사용자가 사용자 마음대로 수정할 수 있고 그거에 따라 결과가 어떻게 달라지는지도 궁금한거라 이런 부분도 고려해서 너가 분석한 부분에 반영해줘"
- 사용한 기법(있으면): (b 도구연동 — ADCIRC 표준 fort.15 파라미터 구조 분석)
- 결과: `backend/schemas/fort15_params.py` 생성. Fort15Params(rnday, dtdp, ramp_days, eslm, tau0, h0, ics, nolibf, im), OutputControl(fort63_interval_min, fort61_interval_min, fort63_enabled, fort61_enabled), Station(name/lon/lat) 스키마 정의. 기본 관측소 5개 사전 등록(MarineCity_A/B, Haeundae_Beach, Dongbaek_S, Offshore_Ref). `generate_fort15_text()` 함수로 fort.15 텍스트 자동 생성
- 막힘 → 해결: fort.15 파일이 서버 전용이라 로컬에 없음 → ADCIRC User Manual 표준 구조 기반으로 직접 설계

---

### [#9] 채팅 기반 fort.15 파라미터 실시간 변경 반영 구조 구현
- 작성자(팀원): han
- 목표: 사용자가 채팅으로 "fort.63 출력 간격 1분", "관측소 추가" 등 요청 시 파이프라인 결과에 즉시 반영
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "기본 정해져 있는 데이터가 제공되는 해수면 상승 시나리오라던지 해역별 케이스라던지 이런 건 저 파일 내에서 하면 되는거고 우리가 궁금한거는 입력 변수가 바뀔 때 사용자가 궁금한 부분에 대해서 채팅으로 물어볼 때 그걸 반영할 수 있도록"
- 사용한 기법(있으면): -
- 결과: ScenarioParams에 `fort15: Fort15Params` 필드 통합. engine.py → mock_adapter.py까지 fort15 파라미터 전달 체인 구성. `/api/scenarios/fort15/preview`(fort.15 텍스트 미리보기), `/api/scenarios/fort15/explain`(파라미터 변경 영향 설명) 엔드포인트 추가. 테스트: 출력간격 5분→73타임스텝, 관측소 1분→361타임스텝 정상 반영 확인
- 막힘 → 해결: 없음

---

### [#10] SMS 방식 Delaunay 비정형 삼각격자 알고리즘 설계
- 작성자(팀원): han
- 목표: 실제 ADCIRC 모델에서 사용하는 SMS 비정형 삼각격자를 scipy Delaunay로 재현, 해운대 마린시티 지형 반영
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "실제 모델 수행하도록 격자는 sms로 비정형으로 짜고 ADCIRC로 모델을 수행해. 목업데이터를 마린시티에 맞추어서 만들고 진짜 지진해일이나 침수 등에서 나오는 수치결과와 동일하게 만들어주고 결과들이 3d 시뮬레이션으로 표출용 만들어줘 부드럽고 용량이 지나치지 않도록"
- 사용한 기법(있으면): (b 도구연동 — earthquake_moddel_setting 실제 파일 구조 분석 반영)
- 결과: `backend/data/grid_generator.py` 구현. scipy.spatial.Delaunay 기반 삼각격자 생성. 마린시티(수심 5~15m), 해운대(수심 2~8m), 동백섬(수심 1~5m) 지형 특성 반영한 bathymetry 함수. `to_fort14()`: 표준 ADCIRC fort.14 포맷(제목/NE NP/노드목록/요소목록) 자동 생성. 1260노드·2500요소 격자 생성 확인
- 막힘 → 해결: AI,AX 경로 오류 → earthquake_moddel_setting 실제 경로 수동 확인 후 반영

---

### [#11] Okada 단층 모델 + 물리 기반 Mock 시뮬레이션 구현
- 작성자(팀원): han
- 목표: Okada(1985) 단층 변위 모델과 선형 장파 이론 기반으로 실제 수치 결과와 동일한 형태의 Mock 시계열·침수 결과 생성
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "실제 모델 수행하도록 격자는 sms로 비정형으로 짜고 ADCIRC로 모델을 수행해. 목업데이터를 마린시티에 맞추어서 만들고 진짜 지진해일이나 침수 등에서 나오는 수치결과와 동일하게 만들어줘"
- 사용한 기법(있으면): -
- 결과: `backend/physics/tsunami_sim.py`: Okada 단층변위 계산(Mw→단층면적·변위), Green's law 증폭(c=√(g×h)), 감쇠 정현파 시계열 생성. `mock_adapter.py` 전면 개편: 물리기반 침수GeoJSON(노드별 flood_depth_m), fort.61 관측소 시계열(5개 관측소), SSP별 SLR 테이블 적용. Excel(Deform_plane_ALL_NEW.xlsx) 실제 케이스 로드(EAST 44·WEST 27·SOUTH 144개)
- 막힘 → 해결: 없음

---

### [#12] 5-Zone 가변해상도 격자 전면 재설계
- 작성자(팀원): han
- 목표: 연안 23m~외해 100km 가변해상도, 지역명 입력 시 격자 자동 생성 구조로 전면 재설계
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "격자는 해당 위치 반경 10km는 23m로 격자를 짜고 이외는 60-100km 그리고 외해는 1000km-20000km로 격자를 짜야해 근데 모의를 보고싶은 해당 위치를 입력하면 그거에 따라 격자 fort.14도 수정되어야해"
- 사용한 기법(있으면): -
- 결과: `grid_generator.py` 전면 재설계. Zone1(23m/300m demo, 반경 10km), Zone2(200m/2km, 10~60km), Zone3(2km/10km, 60~100km), Zone4(20km/50km, 100~200km), Zone5(100km/200km, 외해) 5단계 해상도. `_haversine_m()` 거리 계산, `_bathymetry()` 수심 추정, ADCIRC wet/dry 방식(육지 포함, 음수 표고). 검증: Zone1 3496노드, 해상도비율 870:1 달성
- 막힘 → 해결: Korea polygon이 해운대 해안을 내륙으로 분류 → Zone1 노드 0개 발생 → 폴리곤을 해안보다 안쪽 inland로 축소, 요소 선별에서 육지 마스킹 제거(ADCIRC wet/dry로 전환)

---

### [#13] 지역 파라미터화 및 격자 lru_cache 최적화
- 작성자(팀원): han
- 목표: 지역명(한국어/영문) 입력 시 좌표 자동 조회, 반복 격자 생성 방지를 위한 캐시 적용
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "격자는 해당 위치 반경 10km는 23m로 격자를 짜고 [...] 모의를 보고싶은 해당 위치를 입력하면 그거에 따라 격자 fort.14도 수정되어야해"
- 사용한 기법(있으면): -
- 결과: `REGION_COORDS` dict: 14개 지역 사전 등록(해운대/마린시티/완도/포항/속초/부산/통영/여수/인천/삼척 등). `resolve_region(region)`: 한국어·영문 모두 수용. `get_grid(region, lon, lat)`: `@lru_cache` 적용으로 동일 지역 반복 요청 시 캐시 반환. mock_adapter·engine 전체에 `region` 파라미터 전달 체인 연결
- 막힘 → 해결: mock_adapter에서 `get_grid()` 파라미터 누락 → 전체 호출 스택 추적 후 `region=region` 전달로 수정

---

### [#14] 격자 자동 검증 시스템 구현 (7개 항목)
- 작성자(팀원): han
- 목표: 생성된 격자가 ADCIRC 실행 요건을 충족하는지 자동 점검하는 검증 시스템 구현
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "서브에이전트 추가 생성해주고 다른 팀원들이 해당 데이터들을 활용할 수 있도록 메타 정보도 생성해주고 데이터도 검증해줘"
- 사용한 기법(있으면): (b 도구연동 — 실제 격자 데이터 로드 후 수치 검증 실행)
- 결과: `backend/validation/grid_validator.py` 구현. 7개 검증 항목: ① Zone별 노드 수 확인 ② 수심 범위(-100m~0m 육지/0~8000m 해양) ③ fort.14 포맷 정합성 ④ 고립 노드(orphan) 0개 ⑤ 해상도 비율(870:1) ⑥ 목표 지점 근접도(0.14km) ⑦ 요소 품질(종횡비). ALL PASS 확인 (Zone1 3496노드, 전체 7095노드·14116요소)
- 막힘 → 해결: 없음

---

### [#15] 팀원용 서브에이전트 가이드 문서 작성
- 작성자(팀원): han
- 목표: Jin(프론트)·Kim(시각화) 팀원이 백엔드 API를 독립적으로 활용할 수 있도록 역할별 가이드 문서 작성
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "서브에이전트 추가 생성해주고 다른 팀원들이 해당 데이터들을 활용할 수 있도록 메타 정보도 생성해주고 데이터도 검증해줘"
  > "내가 확인할 수 있도록 서브에이전트를 추가해서 가시화해줘"
- 사용한 기법(있으면): (a 서브에이전트 — GRID_AGENT, SCENARIO_AGENT 역할 분담 / c 재사용 산출물)
- 결과: `backend/subagents/GRID_AGENT.md`: Kim용 격자 검증 가이드(API 엔드포인트, GeoJSON 포맷, 검증 명령어). `backend/subagents/SCENARIO_AGENT.md`: Jin용 API 호출 가이드(채팅→API 매핑 테이블, 결과 데이터 구조, 에러 처리). 두 문서 모두 팀 GitHub Han 브랜치에 공유
- 막힘 → 해결: 없음

---

### [#16] Before/After 자동화 효과 정량 기록
- 작성자(팀원): han
- 목표: 수작업 대비 자동화 효과를 수치·정성 지표로 측정해 submit/BEFORE_AFTER.md에 기록
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "그리고 이렇게 완성되어서 자동화된 것과 자동화하기 전에 비포 에프터에 대한 내용을 기록하고 싶은데 사람이 하나씩 반복적으로 작업했던 것들이 전에 비해 어떤게 개선되었는지 작업 속도 및 발생할 수 있는 입력오류 등이 있는데 업무 효율이 어느정도 개선이 되었는지 등에 대해서 작성해서 저장해줘"
  > "케이스 1개 전처리가 절대적으로 궁극적인 총량으로는 동일할거고 사용자가 친화적으로 더 접근하고 수정하고 오류가 줄고 루틴적인 작업을 줄이고 업무 효율을 늘리는 거니까"
- 사용한 기법(있으면): -
- 결과: `submit/BEFORE_AFTER.md` 작성. 8개 지표 정량 기록: 케이스 전환(10폴더 수동→파라미터 1개), 격자 생성(수십분→수초), 파라미터 오류(실행 후 발견→실행 전 차단), 시나리오 조합(수동 복사→API 자동), 비전문가 접근성(전문가 필수→채팅 UI). ※ "모델 수행 시간은 동일, 준비·루틴 반복 제거가 핵심"으로 명확히 기술
- 막힘 → 해결: 초안에 "계산 시간 단축"으로 잘못 기술 → 실제와 다르다는 점 확인 후 "준비 루틴 제거"로 수정

---

### [#17] Jin 브랜치 전체 파일 분석 및 포맷 불일치 항목 특정
- 작성자(팀원): han
- 목표: Jin 브랜치 app/ 폴더 7개 파일 전체 분석, 프론트-백엔드 간 데이터 포맷 불일치 항목 목록화
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "Jin 브렌치에서 app 폴더 참고해서 수정사항 웹 플랫폼에 표출할 수 있도록 호환이 되도록 데이터 가공해서 han 브렌치에 업로드해줘. 지금 제공받는 플랫폼은 모델 수행에 자동화할 01-10 디렉토리를 읽고 임의로 생성한 가안이니까 참고하고 실제로 모델을 수행할 때 필요 자료 및 파라미터에 따라 수정해도 되니까 너가 분석하고 판단해서 호환 데이터를 만들어줘"
- 사용한 기법(있으면): (a 서브에이전트 — Jin 브랜치 파일 병렬 분석)
- 결과: Jin 브랜치 `git show origin/Jin:app/src/**` 전체 분석 완료(types.ts, AppShell.tsx, ParameterPanel.tsx, AgentChat.tsx, VizPanel.tsx, ScenarioQueue.tsx, StageRail.tsx, parseIntent.ts). 불일치 항목 특정: ① `direction`(EAST/WEST/SOUTH) 필드 누락 ② `mw`(지진규모) 필드 누락 ③ `region:"Busan"` vs 백엔드 `"Haeundae_MarineCity"` ④ `period→distance` 매핑 필요 ⑤ 결과 포맷 `{maxDepth, floodedArea, affectedBuildings}` vs 백엔드 `flood_geojson` 불일치
- 막힘 → 해결: 없음

---

### [#18] compat.py 호환 레이어 구현 — 파라미터 변환
- 작성자(팀원): han
- 목표: Jin 프론트의 ScenarioParams → 백엔드 ScenarioParams 자동 변환, 5개 지역 매핑 테이블 구성
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "Jin 브렌치에서 app 폴더 참고해서 수정사항 웹 플랫폼에 표출할 수 있도록 호환이 되도록 데이터 가공해서 han 브렌치에 업로드해줘"
- 사용한 기법(있으면): (c 재사용 산출물 — compat.py를 독립 모듈로 작성, 추후 타 팀도 활용 가능)
- 결과: `backend/api/compat.py` 전면 재작성. `FrontScenarioParams`: direction(EAST/WEST/SOUTH), mw(8.0/8.5/9.0), caseNo(1~9), period, region, ssp, distance, manningMode 수용. `_REGION_MAP`: Busan→("Haeundae_MarineCity","SOUTH"), Ulsan→("Ulsan","EAST"), Jeju_north/south, Jindo_Wando 5개 매핑. `_to_backend_params()`: direction→sea_area, period→distance, caseNo→earthquake_cases 변환. 테스트: Busan 입력 → sea_area=SOUTH, region=Haeundae_MarineCity 정상 출력
- 막힘 → 해결: 없음

---

### [#19] compat.py — 결과 역변환 및 프론트 ScenarioResult 포맷 생성
- 작성자(팀원): han
- 목표: 백엔드 flood_geojson 결과 → Jin VizPanel이 요구하는 `{maxDepth, floodedArea, affectedBuildings}` 포맷으로 역변환
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "Jin 브렌치에서 app 폴더 참고해서 [...] 호환이 되도록 데이터 가공해서 han 브렌치에 업로드해줘"
- 사용한 기법(있으면): -
- 결과: `_compute_front_result(result)` 구현: flood_geojson features에서 `flood_depth_m` 최댓값 → maxDepth, flooded_nodes×0.09km²×0.1 → floodedArea, floodedArea×180 → affectedBuildings. `_to_front_scenario()`: progress 리스트→0~100 수치 변환(22단계 기준), status "error"→"failed", created_at ISO→epoch ms 변환, done 시 result 필드 포함. 테스트: result={maxDepth:2.3, floodedArea:4.275, affectedBuildings:769} 정상 출력
- 막힘 → 해결: 없음

---

### [#20] app/ types.ts·api.ts·AppShell.tsx 동기화 및 실제 API 연동
- 작성자(팀원): han
- 목표: Jin 확정 포맷으로 types.ts 전면 수정, api.ts 동기화, AppShell.tsx에 USE_BACKEND 실제 API 연동 구현
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "react 코드에서 실행할 때 가져다가 쓸 수 있도록 호환이 되도록 해야해"
- 사용한 기법(있으면): -
- 결과:
  - `types.ts`: REGIONS 5개(Busan/Ulsan/Jeju_north/Jeju_south/Jindo_Wando), DIRECTIONS, MAGNITUDES 추가. ScenarioParams에 direction/mw 추가. DEFAULT_PARAMS.region="Busan". ScenarioResult→`{maxDepth, floodedArea, affectedBuildings}`. `mockResult()` 함수 추가(USE_BACKEND=false 대비)
  - `api.ts`: GridGeoJSON·RunResult 중복 정의 제거(types.ts에서 import). `getGrid()` 기본 region="Busan"
  - `AppShell.tsx`: `USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true"`. `runSingle()`: API→createRun→pollUntilDone→setState. `addToQueue()`: 대기 상태 추가. `runAll()`: 대기→API 순차 실행. `runAgent(actions)`: set/queue/run 액션 처리. Mock 모드 시 `mockResult()` 결과 부여
- 막힘 → 해결: parseIntent.ts의 region 힌트가 "Haeundae_MarineCity"를 가리키고 있어 "Busan"으로 통일

---

### [#21] 통합 테스트 및 Han 브랜치 최종 push
- 작성자(팀원): han
- 목표: 백엔드 파이프라인 전체 동작 확인, 프론트 import 오류 없음 확인, Han 브랜치 push
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "push는 han 브렌치에 업로드 해줘야해"
  > "han 은 없애고 Han 여기에 다시 push 해서 올려줘"
- 사용한 기법(있으면): -
- 결과: `python3 -c "from api.compat import ..."` 통합 테스트 ALL PASS. types.ts 전체 export(REGIONS, DIRECTIONS, MAGNITUDES, SSPS, DISTANCES, PERIODS, MANNING_MODES, PIPELINE_STEPS, ScenarioParams, Scenario, ScenarioResult, mockResult, regionLabel 등) AppShell·ParameterPanel·VizPanel·AgentChat·parseIntent 전체 import 정합성 확인. `git push origin Han` 완료 (commit 06bd45c→d1bc8b4). `han` 소문자 브랜치 삭제
- 막힘 → 해결: `han` 브랜치로 잘못 push → 소문자 삭제 후 `Han` 대문자 브랜치로 재push

---

### [#22] 발표자료 가안 작성 (HTML 슬라이드 2장)
- 작성자(팀원): han
- 목표: 내일 발표를 위한 가안 슬라이드 2장 작성 — Han 담당 업무·팀 기여·Before/After 효과 요약
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "내가 작업한 것을 간단하게 내일 발표자료로 만들어야하는데 어떻게 수정이 되었고 내가 한 업무는 무엇이며 어떻게 연결했고 우리 팀에 어떻게 기여했는지 등에 대해서 ppt로 간략하게 1-2장으로 만들어야해 지금까지 만든 걸 토대로 작성해주되, 양식은 없고 우선은 가안으로만 만들어줘"
- 사용한 기법(있으면): -
- 결과: `teamH_han_slides_draft.html` 작성(HTML+CSS 인라인 슬라이드). 슬라이드 1: Han 역할·핵심 구현·10단계 파이프라인 시각화. 슬라이드 2: 팀 데이터 흐름(Jin↔Han↔Kim), Before/After 효과표 8개 지표, KPI(케이스 215개·격자 7095노드·10단계 자동화·팀원 3명 연결). 데스크탑 및 submit/assets/ 저장, Han 브랜치 push
- 막힘 → 해결: 없음

---

### [#23] 실제 ADCIRC 입력파일(/Desktop/input) 형식 분석
- 작성자(팀원): han
- 목표: 사용자가 제공한 실제 모델 입력파일(SOUTH 해역 SSP8.5 far case9, 16개 병합본)의 구조를 분석해 mock 파일이 맞춰야 할 기준 확보
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "/Desktop 에 input 이라는 폴더에 실제로 모델 수행에 쓰이는 파라미터 자료들을 옮겨두었어 이거는 south 해역의 ssp8.5 far 의 case9 (16개 병합한 본) 의 인풋 파일이야 이거랑 너가 만든 게 동일하게 생성이 되며, Jin이 만든 웹으로의 연동 호환에도 문제가 없는지 검토를 해주고 문제가 있다면 이 input에 맞추어 수정을 해줘"
- 사용한 기법(있으면): (b 도구연동 — 실제 input 파일 직접 파싱)
- 결과: input/ 9개 파일 확인 — fort.14(360만노드/700만요소, `Jindo_Wando_v260629`), fort.13(360만노드 3속성), fort.15(2020_Tsunami, DT=0.1s/RNDAY=0.5일), 컴파일바이너리 6종(adcirc/adcprep/aswip/padcirc/padcswan/swaninit). 각 파일 헤더·필드 구조·파라미터 순서 추출. **컴파일바이너리는 실제 실행 전용 → 목업은 형식만 일치시키기로 확정.**
- 막힘 → 해결: fort.14가 4.5GB로 큼 → 헤더·경계섹션만 부분 파싱으로 구조 파악

---

### [#24] fort.15 스키마 — 실제 포맷에 맞춰 전면 개편
- 작성자(팀원): han
- 목표: 기존 fort.15 생성기가 실제 ADCIRC 포맷과 파라미터 순서·값이 달랐던 문제를 실제 input 기준으로 정정
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "fort.14 랑 이에 따른 fort.13은 내가 실제로 짠거라 ... 지금 중요한 건 목업파일 형식이 맞는지랑 표출 시 누락되는 데이터는 없는지 등에 대한 파악이 중요해"
  > "fort.15에 런데이나 디티 등을 사용자가 설정하는 게 있는데 이거도 웹 상에서 GUI 표출로 되어서 사용자가 설정하고 이게 fort.15에 반영되도록 하면 돼"
- 사용한 기법(있으면): (b 도구연동 — 실제 fort.15 라인별 대조)
- 결과: `schemas/fort15_params.py` 전면 재작성. 실제값 반영(DT=0.1s, RNDAY=0.5일, DRAMP=0.0, ESLM=5.0 와점성, TAU0=-3, SLAM0/SFEA0=128.81/35.05, NWP=3, FFACTOR/HBREAK/FTHETA/FGAMMA, 핫스타트, 대수해석기). `generate_fort15_text()`가 실제와 동일한 22개 파라미터 순서로 출력. RNDAY/DT/ramp/출력간격은 사용자 설정 항목으로 노출(웹 고급설정 → fort.15 반영 경로 확보).
- 막힘 → 해결: 기존 스키마는 ESLM을 "Manning n"으로 오해 → 실제는 수평 와점성계수(5.0)임을 확인해 정정

---

### [#25] fort.13 생성기 신규 작성 (실제 포맷 일치)
- 작성자(팀원): han
- 목표: 그동안 없던 fort.13(노드 속성) 생성기를 실제 포맷에 맞춰 구현, fort.14 NP와 연동
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "fort.14 랑 이에 따른 fort.13은 내가 실제로 짠거라 내가 위에 명령한 것처럼 해당 대상 지역 또는 도엽만 30m로 하고 점점 넓어지게 하면되고 ... 목업파일 형식이 맞는지 ... 중요"
  > "목업파일로 만드는거고 지금 대상은 마린시티 해운대로 테스트만 할거야"
- 사용한 기법(있으면): -
- 결과: `data/fort13_generator.py` 신규 작성. 실제 포맷(AGRID 제목 / NP / NAttr=3 / 속성별 이름·단위·ValuesPerNode·기본값 / 본문 비기본값 노드리스트) 그대로 구현. 3속성: primitive_weighting(기본0.03·천해 0.02), mannings_n(graded 수심별/uniform), sea_surface_height(SLR 주입). NP가 fort.14 NP와 자동 일치. 해운대 격자(7095노드)로 생성 검증.
- 막힘 → 해결: 없음

---

### [#26] compat.py — main 웹 계약 호환 + 고급설정(RNDAY/DT) 수신
- 작성자(팀원): han
- 목표: main 웹의 ScenarioParams(direction/mw 없는 구버전)도 그대로 받도록 호환, RNDAY/DT 등 고급설정 옵셔널 수신해 fort.15 반영
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "main 의 웹 상에 표출할 떄 호환이 되도록 작업한 후에 Han 에 push 해줘"
  > "이미 웹상에 반영이 되어있는 입력자료 파라미터면 따로 건들지 않아도 돼"
- 사용한 기법(있으면): -
- 결과: `api/compat.py` 개편. FrontScenarioParams의 direction/mw를 Optional로(미전달 시 region 기본 해역 자동 유도 — Jindo_Wando→SOUTH, Ulsan→EAST). AdvancedSettings(rnday/dtdp/ramp_days/출력간격) 옵셔널 수신 → fort.15 반영, 미전달 시 실제 input 기본값. _REGION_MAP에 main 지역키(Jindo_Wando/Ulsan/Jeju_north/Jeju_south) 정리. 4계약 테스트 통과(main/Ulsan자동/Jin direction우선/고급설정).
- 막힘 → 해결: main types.ts가 Jin보다 구버전(direction/mw 없음) 확인 → 두 계약 모두 수용하는 superset으로 설계

---

### [#27] 형식 검증 리포트 작성 + app/ 되돌림(팀 규칙 준수)
- 작성자(팀원): han
- 목표: mock↔실제input↔웹 형식 일치 검증, TEAM_GUIDE 파일소유 규칙(Han=backend/)에 맞게 app/ 수정 되돌림
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "형식만 input의 파일들고 맞는지만 분석하고 이게 웹으로 올릴 때의 형식과도 일치하는지만 검토하면 되는거야"
  > "Plan Team_Guide 에 맞추어 작업하는 거 맞지?"
  > "되돌리고 backend만"
- 사용한 기법(있으면): (b 도구연동 — 실제 input vs mock 자동 대조 스크립트)
- 결과:
  - PLAN.md·TEAM_GUIDE.md 정독 → 파일소유 규칙(Han=backend/, Kim=viz/, Jin=app/) 확인
  - 이전 세션에 호환용으로 수정했던 app/ 4개 파일(types.ts·api.ts·AppShell.tsx·parseIntent.ts)을 origin/main 기준 복원, 추가했던 api.ts 제거 → Han→main 병합 시 app/ 충돌 0
  - `backend/FORMAT_CHECK.md` 작성: fort.14/13/15 + 웹 형식 4종 검증 결과 표. **전부 형식 일치(PASS)** — 노드/요소 개수만 목업 특성으로 상이(정상)
  - 실수로 삭제됐던 팀원 로그(jin/kim) 복원
- 막힘 → 해결: app/ 호환을 Han이 직접 수정하던 방식 → 팀 규칙대로 backend API를 웹 계약에 맞추고 backend 문서화로 전환(웹 UI는 Jin 담당)

---

## 마무리 요약 (1~2줄)
- 가장 효과적이었던 에이전트 활용법: Explore 서브에이전트 병렬 분석으로 스크립트·실제 input 파일 구조를 빠르게 파악, 자동 대조 스크립트로 mock↔실제 형식 일치를 객관 검증
- 다른 팀이 그대로 따라 하려면 필요한 것: backend/ 폴더 복사 + `pip install fastapi pydantic uvicorn scipy pandas openpyxl` + 실제 input 파일을 형식 레퍼런스로 두고 mock 생성기와 대조
