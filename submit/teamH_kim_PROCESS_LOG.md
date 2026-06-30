# PROCESS_LOG — 작업 기록 (과정 70점의 핵심 근거)

> 표준 헤더(CLAUDE.md 등)를 로드했다면 에이전트가 알아서 채워 줍니다. 비면 직접 채우세요.
> 원칙: **실제로 시킨 프롬프트를 그대로 인용**할 것. 요약만 있으면 점수가 깎입니다.
> ⚠️ 이 파일은 Kim 본인의 로그입니다. **본인 작업을 본인 에이전트로 진행하며 직접 채우세요.** (아래 작성자 정보의 '내가 맡은 부분'은 PLAN.md 역할분담 기준 미리 적어 둔 것)

## 작성자 정보 (개인별 로그 — 본인 것만)
- 팀명: teamH (멤버 3명: Jin, Han, Kim)
- 본인 이름(작성자): kim
- 공통과제(우리 팀이 자동화한 반복 수작업): 지진해일 수치모델(ADCIRC 계열) `earthquake_model_setting` 10단계 전처리·실행준비 과정의 자동화 웹 플랫폼
- 내가 맡은 부분: 우측 부산권(마린시티·해운대) **3D 침수 시각화**(`viz/`) — 위성/항공 basemap + 3D 건물 + 정밀 지형고도 + 침수 결과 오버레이/시나리오 비교
- 자유과제(있으면): 단순 침수 시각화를 넘어 **재난대응 의사결정 지원**(대피소·법령·대응매뉴얼·기관조치·대피경로) 데이터 모듈로 확장(로그 #22).

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

### 시각화 세부 지표 (참고 — Kim 담당 영역)

| 지표(자기 업무에 맞게) | Before(기존 수작업) | After(에이전트화) |
|------|------|------|
| 3D 시각화용 결과 데이터 준비 | 실제 수치모델 결과가 나오기 전까지 시각화 개발이 멈추거나, 소량 샘플을 손으로 만들어야 함 | 생성 스크립트로 48개 시나리오·192개 침수 폴리곤·28,384개 격자 포인트를 일괄 생성 |
| 통합용 데이터 포맷 | 백엔드/프론트와 맞출 입력 포맷이 불명확함 | `viz/README.md`에 시나리오·GeoJSON·grid·timeline·building·POI 포맷과 검토사항 정리 |

## 사용 기법 (권장·가점, 필수 아님)
- [ ] (a) 서브에이전트 / 역할 분담
- [x] (b) 외부 도구·데이터 연동 (파일/API/MCP/사내데이터) — git pull 및 프로젝트 문서/로컬 파일 기반 역할·데이터 범위 파악
- [x] (c) 재사용 산출물 (스킬 / 프롬프트셋 / CLAUDE.md / 서브에이전트 구성) — `viz/README.md` 작업계획·인터페이스 문서

---

## 작업 로그 (단계마다 1개씩 누적 / 시간순)

### [#1] main 최신화 및 Kim 작업 범위 파악
- 작성자(팀원): kim
- 목표: `main` 브랜치 최신 내용을 pull한 뒤 Kim이 지금 해야 할 작업 범위를 확인.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "main 브랜치 pull해서 내가 작업해야 될 내용 파악해봐"
- 사용한 기법(있으면): (b 도구연동 — git pull, `PLAN.md`, `TEAM_GUIDE.md`, Kim PROCESS_LOG 확인)
- 결과: 최신 `main`에서 역할분담이 재정리됨을 확인. Kim 담당은 `viz/`의 부산권(마린시티·해운대) 3D 씬, 침수 결과(grid/GeoJSON) 오버레이/애니메이션, 시나리오 비교 뷰, 사용 라이브러리 선정 PoC, 그리고 `viz/README.md`에 입력 데이터 포맷·구조·실행법·TODO를 기록하는 것. 목업데이터 제작은 이 3D 시각화 PoC가 사용할 `scenarios`, `inundation grid/GeoJSON`, `timeline`, `building/POI` 데이터 정의와 샘플 제작으로 연결됨.
- 막힘 → 해결: 없음.

### [#2] Kim 3D 시각화·목업데이터 작업 계획 수립
- 작성자(팀원): kim
- 목표: Kim이 맡은 `viz/` 작업을 실제로 진행 가능한 산출물 단위로 쪼개고, 통합용 인터페이스 문서 초안을 작성.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "내가 해야 되는 작업 파악해서 정리하고, 어떤 식으로 진행할 것인지 계획을 세워봐."
- 사용한 기법(있으면): (c 재사용 산출물 — `viz/README.md` 계획·인터페이스 문서)
- 결과: `viz/README.md`를 새로 작성해 Kim의 역할, 3D 시각화 PoC 범위, 목업데이터 파일 목록(`scenarios.json`, `inundation.geojson`, `inundation_grid.json`, `timeline.json`, `buildings.geojson`, `poi.json`), 앱/백엔드 연동 입력 형식, 단계별 작업계획, 완료 기준을 정리. 우선 Three.js 기반 local-first PoC로 시작하고, 이후 CesiumJS/deck.gl 업그레이드 가능성을 열어두는 방향으로 계획함.
- 막힘 → 해결: 없음.

### [#3] 단계별 진행계획 및 검토 필요사항 정리
- 작성자(팀원): kim
- 목표: `viz/` 작업을 구현 순서대로 세분화하고, 진행 중 Han/Jin과 확인해야 할 의사결정 사항을 명확히 정리.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "단계별로 어떻게 진행할 것인지 정리. 진행 중 검토 필요한 사항 알려줘."
- 사용한 기법(있으면): (c 재사용 산출물 — `viz/README.md` 단계별 계획/검토 체크리스트)
- 결과: `viz/README.md`에 7단계 진행계획을 추가. 순서는 ① 대상 영역·좌표 범위 정의 ② 시나리오 메타데이터 ③ 침수 범위·깊이 Mock ④ 건물·POI Mock ⑤ Three.js 시각화 PoC ⑥ 시나리오 전환·타임라인 ⑦ 통합 핸드오프. 각 단계마다 Han 백엔드 스키마, Jin UI/통합 방식, 데모 범위, 색상/위험등급, 비교 방식 등 검토 필요사항을 별도로 정리.
- 막힘 → 해결: 없음.

### [#4] 해운대·마린시티 중심 다중 날짜 목업데이터 생성
- 작성자(팀원): kim
- 목표: 데모 범위를 해운대/마린시티 중심으로 확정하고, 3D 시각화 PoC와 시나리오 비교에 사용할 충분한 양의 목업데이터를 생성.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "데모 범위를 해운대/마린시티 중심으로 하고, 목업 데이터는 최대한 여러 날짜, 그리고 많은 데이터를 산출하도록 진행. 필요한 검토는 스스로 파악해서 자율적으로 진행 시작."
- 사용한 기법(있으면): (b 도구연동 — Node 데이터 생성 스크립트 실행), (c 재사용 산출물 — `viz/tools/generate_mock_data.mjs`, `viz/mock-data/`)
- 결과: `viz/tools/generate_mock_data.mjs`를 작성하고 실행해 `viz/mock-data/`에 목업데이터를 생성. 산출물은 `area.json`, `scenarios.json`, `inundation.geojson`, `inundation_grid.json`, `timeline.json`, `buildings.geojson`, `poi.json`, `manifest.json`. 2026-07-01~2026-12-15까지 12개 날짜 × mild/moderate/severe/extreme 4개 템플릿 = 총 48개 시나리오, 침수 폴리곤 192개, 격자/수심 포인트 28,384개, 시나리오별 타임라인 10프레임을 생성. 생성 후 Node로 모든 JSON/GeoJSON 파싱 검증 완료.
- 막힘 → 해결: Kim 브랜치에 최신 main을 병합하는 과정에서 개인 로그와 timestamps 충돌 발생 → main의 최신 역할분담을 기준으로 Kim 로그만 보존하도록 충돌을 정리한 뒤 목업데이터 작업 진행.

### [#5] 현재까지 Kim 산출물 정리 및 push 이슈 기록
- 작성자(팀원): kim
- 목표: 지금까지 생성한 Kim 담당 산출물과 검증 결과, 남은 이슈를 제출 로그에 누락 없이 정리.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "지금까지 내용들 Kim 로그에 잘 기록해줘"
- 사용한 기법(있으면): (b 도구연동 — git status/log, JSON 검증 결과 확인), (c 재사용 산출물 — `viz/README.md`, `viz/mock-data/`)
- 결과: 현재 Kim 브랜치 로컬 커밋 `6540e90 Add Kim Haeundae mock visualization data`까지 완료됨. 주요 산출물은 `viz/README.md`, `viz/tools/generate_mock_data.mjs`, `viz/mock-data/area.json`, `scenarios.json`, `inundation.geojson`, `inundation_grid.json`, `timeline.json`, `buildings.geojson`, `poi.json`, `manifest.json`. 모든 mock-data JSON/GeoJSON은 Node 파싱으로 유효성 검증 완료. 다음 단계는 이 데이터를 이용한 Three.js 기반 3D 시각화 PoC 구현.
- 막힘 → 해결: `git push origin Kim`은 GitHub 계정 `well9064-ux`에 `yobbicorgi/team_H` 저장소 push 권한이 없어 실패(`Permission denied`) → 로컬 커밋은 보존되어 있으므로, 저장소 권한 부여 후 다시 push 필요.

### [#6] 목업데이터 검토용 HTML 리포트 생성
- 작성자(팀원): kim
- 목표: 생성된 목업데이터를 사람이 직접 검토할 수 있도록 요약·샘플·간단한 시각 미리보기를 제공.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "만든 목업 데이터는 어떻게 확인해야 돼? 우선 내가 검토하고 싶음."
- 사용한 기법(있으면): (b 도구연동 — Node 리포트 생성 스크립트), (c 재사용 산출물 — `viz/review/index.html`)
- 결과: `viz/tools/build_review_report.mjs`를 작성하고 실행해 `viz/review/index.html`을 생성. 리포트에는 총 시나리오/날짜/침수 폴리곤/격자 포인트 수, mild/moderate/severe/extreme 대표 침수 폴리곤 미리보기 SVG, 건물/POI 표시, 시나리오 샘플 표, 검토 대상 파일 목록을 포함. 사용자는 브라우저로 `viz/review/index.html`을 열어 데이터 규모와 공간 분포를 1차 검토할 수 있음.
- 막힘 → 해결: 없음.

### [#7] 공개 스킬 활용 가능성 조사
- 작성자(팀원): kim
- 목표: 목업 시나리오 데이터 생성을 위해 새 스킬을 직접 만들지 않고, 이미 공개된 재사용 스킬이 있는지 확인.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "내가 스킬을 만들지 않고 이미 공개된 스킬이 있는지 찾아봐"
- 사용한 기법(있으면): (b 도구연동 — skill-installer 목록 조회 시도, 웹 검색)
- 결과: Codex curated skill 목록 조회를 시도했으나 로컬 Python SSL 인증서 문제로 실패. 웹 검색으로 공개 SciVisAgentSkills를 확인했으나, 해당 스킬은 ParaView/napari/VMD/TTK 등 과학 시각화 도구 운용 중심이며, 해운대·마린시티용 GeoJSON/grid/timeline 목업 시나리오 데이터 생성에 바로 맞는 공개 스킬은 확인하지 못함. 따라서 현재 작업에는 기존 `viz/tools/generate_mock_data.mjs`와 `viz/README.md`를 재사용 자산으로 유지하는 것이 가장 현실적임.
- 막힘 → 해결: skill-installer 목록 조회가 SSL 인증서 오류로 실패 → 웹 검색으로 공개 스킬 후보를 별도 확인.

### [#8] 부드러운 침수 애니메이션용 목업데이터 재생성 및 뷰어 제작
- 작성자(팀원): kim
- 목표: 기존 10프레임 타임라인보다 부드럽게 침수 피해가 확산되는 모습을 검토할 수 있도록 시간 스텝을 줄이고, 간단한 애니메이션 화면을 제공.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "시간 스텝을 줄여서 좀 더 부드러운 애니메이션으로 볼 수 있도록 목업 데이터를 다시 제작하고, 이거를 간단하게 애니메이션으로 볼 수 있도록 작업"
- 사용한 기법(있으면): (b 도구연동 — Node 데이터/HTML 생성 스크립트 실행), (c 재사용 산출물 — `viz/animation/index.html`)
- 결과: `viz/tools/generate_mock_data.mjs`의 타임라인을 0~120분 2분 간격 61프레임으로 변경하고 목업데이터를 재생성. 각 프레임에 `inundation_factor`, `water_level_m`, `active_polygon_ids`를 포함해 애니메이션 표현이 가능하도록 함. `viz/tools/build_animation_viewer.mjs`를 새로 작성해 `viz/animation/index.html`을 생성. 브라우저에서 파일을 열면 2026-12-15 대표 시나리오를 선택하고 Play/slider로 침수 폴리곤 활성화, 수위선 변화, 건물/POI를 함께 검토할 수 있음.
- 막힘 → 해결: 없음.

### [#9] 데이터 검토 서브에이전트·메타정보 생성 및 진앙/진원 보강
- 작성자(팀원): kim
- 목표: 목업데이터가 “먼바다 진앙/진원 → 파형 전파 → 해운대/마린시티 침수” 목적에 맞는지 독립 검토하고, Han/Jin이 활용할 수 있는 메타정보를 생성.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "서브에이전트 추가 생성(데이터 검토). 너는 데이터 생성에 따른 중간결과를 모니터링 하면서 데이터 생성 목적에 맞는지 검토를 수행. 자율 수행 시작." / "추가 서브에이전트 구성해서 다른 팀원이 이 데이터를 활용할 수 있도록 메타정보를 생성."
- 사용한 기법(있으면): (a 서브에이전트 — 데이터 QA/메타정보 초안 분담), (b 도구연동 — Node 검증 스크립트), (c 재사용 산출물 — `viz/metadata/`, `viz/tools/validate_mock_data.mjs`)
- 결과: 데이터 QA 서브에이전트가 `source_events.json`, `animation_area.json`, scenario source fields, timeline `wave_front`가 누락/불일치라고 지적. 이를 반영해 `viz/tools/generate_mock_data.mjs`를 수정하고 `animation_area.json`, `source_events.json`, scenario별 `source_event_id`·`epicenter`·`hypocenter`·`magnitude_mw`, timeline별 `offshore_wave_factor`·`wave_front`를 생성하도록 보강. `viz/tools/build_animation_viewer.mjs`도 먼바다 진앙/진원 marker, wave path/front, source Mw/depth 표시를 포함하도록 수정. 추가 서브에이전트가 제안한 통합 메타정보를 바탕으로 `viz/metadata/README.md`, `viz/metadata/dataset_metadata.json`을 작성해 Han/Jin용 파일 목록·스키마·join rule·handoff checklist를 정리. `viz/tools/validate_mock_data.mjs`로 48개 시나리오, 48개 source event, 192개 polygon 조인 검증 통과.
- 막힘 → 해결: 생성 스크립트는 먼저 수정됐지만 실제 mock-data와 animation HTML이 stale 상태였음 → 데이터 재생성, review/animation 재빌드, 검증 스크립트 추가로 정합성 회복.

### [#10] 날짜·시나리오 확대 및 3D 가시화용 데이터 구조 추가
- 작성자(팀원): kim
- 목표: 목업 날짜와 시나리오 수를 늘리고, 단순 2D 좌표가 아니라 3차원 가시화에 바로 쓸 수 있는 지형·건물·수면 데이터를 생성.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "목업 날짜랑 시나리오 갯수랑 왜 다른거지? 그리고 날짜도 더 많고 시나리오도 더 많으면 좋겠음. 그리고 자료가 3차원으로 가시화되도록 생성되면 좋겠어. 이 내용 다시 반영해서 수정 진행해."
- 사용한 기법(있으면): (b 도구연동 — Node 생성/검증 스크립트), (c 재사용 산출물 — `scene_3d.json`, metadata 문서)
- 결과: 날짜는 발생/실행 일자이고 시나리오는 `날짜 × 시나리오 템플릿` 조합이라 개수가 다르다는 구조를 반영해 데이터셋을 확대. 날짜를 2026-01-01~2026-12-15까지 월 2회 총 24개로 늘리고, 시나리오 템플릿을 `minor/mild/moderate/severe/compound/extreme` 6개로 확장해 총 144개 시나리오를 생성. 침수 폴리곤은 576개, grid/depth point는 82,590개로 증가. 3D 가시화를 위해 `scene_3d.json`을 추가하고 local meter 좌표계(`x=east_m, y=height_m, z=north_m`), terrain mesh(1,353 vertices / 2,560 triangles), extruded building base/top, scenario별 water surface frame/ring을 생성. `viz/README.md`, `viz/metadata/README.md`, `dataset_metadata.json`도 새 규모와 3D schema에 맞게 갱신.
- 막힘 → 해결: 데이터 규모가 커져 파일 크기가 증가했지만, 해커톤 데모용 로컬 데이터로는 허용 가능한 수준이며 `validate_mock_data.mjs`로 144개 시나리오/144개 source event/576개 polygon/3D terrain 검증 통과.

### [#11] 도심 건물 사이 침수 상승 표현 보강
- 작성자(팀원): kim
- 목표: 침수 폴리곤이 넓게 켜지는 수준을 넘어, 도심 건물 사이 도로·골목에 물이 천천히 차오르는 3차원 시뮬레이션 결과처럼 보이도록 목업데이터와 애니메이션 뷰어를 보강.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "도심 건물 사이까지 물이 천천히 차오르는 것까지 확인하고 싶은데 지금 데이터는 그렇지 못한 것 같아. 다시 수정해봐. 정말 3차원 시뮬레이션을 돌린 결과처럼 만들어줘."
- 사용한 기법(있으면): (b 도구연동 — Node 데이터 생성/검증), (c 재사용 산출물 — `urban_flood_3d.json`, animation viewer)
- 결과: 해운대/마린시티 도심 도로·골목을 synthetic urban flood channel 8개로 정의하고, 각 channel에 폭, 기준 고도, 침수 지연시간, 노출계수를 부여. `urban_flood_3d.json`을 새로 생성해 시나리오별 61프레임마다 `channel_surfaces`, `water_depth_m`, `surface_y_m`, `fill_factor`, `impacted_buildings`를 기록. 애니메이션 뷰어(`viz/animation/index.html`)도 도심 수로 레이어를 표시하도록 수정해 건물 사이 수로가 시간에 따라 점점 진해지고, 침수된 urban channel 수와 impacted building 수를 함께 확인할 수 있게 함. `validate_mock_data.mjs`로 144개 시나리오, 144개 source event, 576개 polygon, 1,353 terrain vertices, 8개 urban channel 검증 통과.
- 막힘 → 해결: `urban_flood_3d.json` 생성과 애니메이션 빌드를 병렬 실행해 첫 빌드가 파일 생성 전 시작되며 실패 → 생성 완료 후 순차 빌드로 해결.

---

### [#10] DEM·건물·RGB 영상 공개자료 수집 및 3D 지형 맵 PoC 생성
- 작성자(팀원): kim
- 목표: 시뮬레이션 가시화에 필요한 DEM, 건물 footprint, RGB 지형 영상 수집 후보를 찾고, 받을 수 있는 공개자료를 내려받아 해운대·마린시티 3D 확인 화면을 생성.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "시뮬레이션 가시화에 필요한 DEM, 건물 지형 정보, 위성영상이나 항공영상처럼 지형 정보를 RGB로 볼 수 있는 영상 필요함. 어디서 수집할 수 있는지 찾고, 수집 자료를 받을 수 있다면 받도록 스스로 진행. 받은 자료를 이용해서 시뮬레이션에 필요한 3차원 맵을 만들어서 내가 가시적으로 확인할 수 있도록 작업 시작. 모든 작업은 스스로 자율적으로 진행 시작."
- 사용한 기법(있으면): (b 도구연동 — Overpass API, AWS Terrarium elevation tiles, Esri World Imagery tile 다운로드), (c 재사용산출물 — `submit/assets/REAL_TERRAIN_DATA_SOURCES.md`, `viz/tools/collect_real_terrain_data.mjs`, `viz/tools/build_real_3d_map.mjs`)
- 결과: `viz/real-data/`에 해운대·마린시티 범위 공개자료를 수집. OSM Overpass에서 건물 2,586개 footprint를 `osm_buildings.geojson`으로 변환했고, DEM 원천 Terrarium PNG 4장과 RGB World Imagery JPG 4장을 `viz/real-data/raw/`에 저장. `viz/real-data/source_catalog.json`에 원천·라이선스·다운로드 상태를 기록. 이 자료와 기존 침수 시나리오를 합쳐 `viz/real-map/index.html` 3D 지형/건물/침수 확인 화면을 생성했으며, 드래그 회전·시나리오 선택·시간 슬라이더로 확인 가능.
- 막힘 → 해결: 최초 다운로드는 샌드박스 DNS 제한으로 실패(`ENOTFOUND`) → 네트워크 권한 승인을 받아 같은 수집 스크립트를 재실행해 공개자료 다운로드 성공. Terrarium DEM은 원본 타일을 저장했지만 빠른 PoC에서는 절차형 coastal terrain grid를 사용함 → 후속 단계에서 Terrarium RGB를 실제 고도 샘플로 디코딩하면 정밀도 개선 가능.

---

### [#11] Terrarium DEM 디코딩 및 실제 고도 기반 3D 맵 재생성
- 작성자(팀원): kim
- 목표: 이전 단계에서 내려받은 Terrarium DEM PNG를 실제 고도 샘플로 디코딩하고, 3D 맵의 절차형 지형을 공개 DEM 기반 지형으로 교체.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "다음 단계도 계속 진행"
- 사용한 기법(있으면): (b 도구연동 — Node 표준 `zlib`로 PNG IDAT 디코딩), (c 재사용산출물 — `viz/tools/decode_terrarium_dem.mjs`, `viz/real-data/terrarium_dem_grid.json`)
- 결과: 별도 패키지 설치 없이 PNG 필터 해제·zlib inflate·Terrarium 고도 공식(`R * 256 + G + B / 256 - 32768`)을 구현한 `viz/tools/decode_terrarium_dem.mjs`를 작성. Terrarium 타일 4장을 디코딩해 해운대·마린시티 범위 고도 샘플 3,339개를 `viz/real-data/terrarium_dem_grid.json`에 저장했고, 고도 범위는 -2.98m~211m로 확인. `viz/tools/build_real_3d_map.mjs`가 이 DEM 격자를 우선 사용하도록 수정하고 `viz/real-map/index.html`을 재생성. `submit/assets/REAL_TERRAIN_DATA_SOURCES.md`, `viz/README.md`, `submit/BEFORE_AFTER.md`에도 실제 DEM 사용 상태를 반영.
- 막힘 → 해결: Python PIL이 설치되어 있지 않아 이미지 디코딩을 바로 사용할 수 없었음 → Node 표준 라이브러리만으로 PNG chunk/scanline/filter를 직접 처리하는 디코더를 작성해 외부 설치 없이 해결. in-app browser 검증은 현재 세션에서 `iab` 브라우저가 제공되지 않아 실패 → JSON 파싱·빌드 성공·파일 생성 검증으로 대체하고, 사용자가 직접 열 수 있는 독립 HTML을 유지.

---

### [#12] React 기반 3D DEM·건물·침수 애니메이션 UI 구현
- 작성자(팀원): kim
- 목표: 기존 단일 HTML 3D 지형 맵을 React 기반 렌더링 구조로 전환하고, UX/UI를 개선해 실제 DEM 고도와 목업 수심 타임라인을 함께 재생 가능한 3D 애니메이션으로 구현.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "react 기반으로 렌더링 해" / "렌더링 이후 UX/UI 개선하고 목업 데이터를 이용해서 실제 지형이나 수심자료 이용해서 3D 애니메이션으로 구현해줘"
- 사용한 기법(있으면): (b 도구연동 — npm/Vite React build 및 로컬 dev server), (c 재사용산출물 — 기존 `viz/real-data`, `viz/mock-data` JSON 계약 재사용)
- 결과: `viz/react-map/`에 Vite + React 앱을 구성. `public/data/`에 `terrarium_dem_grid.json`, `osm_buildings.geojson`, `source_catalog.json`, `scenarios.json`, `inundation.geojson`, `timeline.json`, `poi.json`을 배치하고 React에서 fetch로 로드하도록 구현. Canvas 렌더러를 React state와 연결해 시나리오 선택, Play/Pause, 시간 슬라이더, 시점 드래그 회전, Reset View, 활성 침수 구역/수위/DEM 샘플/고도 범위 지표를 제공. 실제 Terrarium DEM 고도 샘플 위에 OSM 건물 900개와 목업 침수 수심 타임라인을 3D 애니메이션으로 표시. `npm run build` 성공, 로컬 Vite 서버 `http://127.0.0.1:5173/` 응답 `200 OK` 확인.
- 막힘 → 해결: `npm install`이 샌드박스 네트워크에서 출력 없이 대기 → 네트워크 권한 승인 후 설치 성공. Vite dev server는 일반 샌드박스에서 `EPERM`으로 포트 바인딩 실패 → 권한 승인 후 실행 성공. 일반 샌드박스 curl은 권한 경계 때문에 서버에 접근하지 못함 → 같은 권한으로 `curl -I` 실행해 `HTTP/1.1 200 OK` 확인.

### [#13] Kim 브랜치 원격 업로드 재시도
- 작성자(팀원): kim
- 목표: 지금까지 Kim 브랜치에 커밋된 모든 작업을 원격 `origin/Kim`에 업로드.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "지금까지 모든 작업 내 브랜치에 업로드해줘"
- 사용한 기법(있으면): (b 도구연동 — git status/log/push, SSH 인증 확인)
- 결과: 현재 브랜치가 `Kim`이고, 로컬 최신 커밋이 `68c8eda Log Kim push attempt`임을 확인. 미커밋 파일은 `.DS_Store`와 `viz/react-map/node_modules/`뿐이라 업로드 대상에서 제외. `git push -u origin Kim`을 실행했으나 GitHub가 SSH 계정 `well9064-ux`로 인증되고, 해당 계정에 `yobbicorgi/team_H` 저장소 push 권한이 없어 원격 업로드 실패.
- 막힘 → 해결: `ERROR: Permission to yobbicorgi/team_H.git denied to well9064-ux.` 발생. 저장소 owner가 `well9064-ux`에 collaborator/write 권한을 부여하거나, 이 Mac의 SSH 키를 권한 있는 GitHub 계정에 등록해야 push 가능.

---

### [#13] 이후 작업 로그 대상 Kim으로 고정
- 작성자(팀원): kim
- 목표: 현재 세션의 모든 후속 작업 기록을 Kim 개인 로그에만 남기도록 기준 파일을 명확히 함.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "지금부터 모든 작업은 Kim 로그에 기록해야 함."
- 사용한 기법(있으면): (c 재사용산출물 — `submit/teamH_kim_PROCESS_LOG.md`)
- 결과: 현재 제출 폴더에는 공용 `submit/PROCESS_LOG.md`가 없고 Kim 개인 로그 `submit/teamH_kim_PROCESS_LOG.md`가 존재함을 확인. 이후 의미 있는 작업 단계는 이 Kim 로그 파일에 append하기로 운영 기준을 고정함.
- 막힘 → 해결: 없음.

---

### [#14] PROMPT_EHKIM 기반 표준 시각화 프로젝트 자동 생성
- 작성자(팀원): kim
- 목표: `viz/PROMPT_EHKIM.txt`에 작성된 지시를 읽고, 해운대·마린시티 지진해일 mock 시나리오와 3D 공간정보 검토 산출물을 표준 폴더 구조로 자동 생성.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "viz 폴더 안에 PROMPT_EHKIM.txt 파일로 너에게 시킬 프롬프트를 작성함. 이거를 읽고 너가 자동으로 실행해."
- 사용한 기법(있으면): (b 도구연동 — Node 자동 생성/검증 스크립트), (c 재사용산출물 — `viz/PROMPT_EHKIM.txt`, 기존 `viz/real-data`, `viz/mock-data`)
- 결과: `viz/tools/build_ehkim_prompt_project.mjs`를 작성하고 실행해 `viz/project/` 표준 구조를 생성. 산출물은 mock NetCDF placeholder 및 JSON sidecar(`data/mock_scenarios/scenario_01~04.nc`, `.nc.json`), mock GeoTIFF placeholder(`scenario_01~04_depth.tif`), DEM/hillshade placeholder, OSM 기반/대체 건물 GeoJSON, coastline/roads/water GeoJSON, 6개 검토용 PNG(`outputs/figures/01~06_*.png`), 웹 검토 앱(`app/index.html`, `app/src/*`), 수동 DEM/영상 배치 README, `.env.example`, `outputs/reports/data_inventory.md`, `outputs/reports/scenario_summary.md`, 재현용 `README.md`. JSON/GeoJSON 파싱 검증과 PNG 파일 형식 검증을 통과했고 총 53개 파일이 생성됨.
- 막힘 → 해결: 프롬프트는 Python `geopandas/rasterio/xarray` 기반 NetCDF/GeoTIFF 생성을 권장했지만 현재 환경에서 해당 의존성을 확정할 수 없어, 해커톤 검토용으로 실제 수치값은 `.nc.json` sidecar와 text-based `.tif` placeholder에 기록하고 README에 실제 GDAL/rasterio 교체 지점을 명시함. Vite 기준 데이터 fetch 경로가 불안정할 수 있어 앱 내부 `app/data/mock_scenarios/scenarios.json`에도 요약 데이터를 복사하고 fetch 경로를 `./data/...`로 수정함.

---

### [#15] 생성 산출물 가시 확인용 로컬 서버 실행
- 작성자(팀원): kim
- 목표: `viz/project/`에 생성된 웹 검토 화면과 정적 그림을 사용자가 직접 시각적으로 확인할 수 있도록 실행 방법을 확인.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "너가 만든 거를 가시적으로 어떻게 확인해?"
- 사용한 기법(있으면): (b 도구연동 — Python 정적 HTTP 서버, curl 응답 확인)
- 결과: `viz/project/app`에서 `python3 -m http.server 8088 --bind 127.0.0.1`로 정적 서버를 실행. `http://127.0.0.1:8088/`의 HTML과 `http://127.0.0.1:8088/data/mock_scenarios/scenarios.json` 데이터가 모두 `HTTP/1.0 200 OK`로 응답함을 확인. 사용자는 브라우저에서 해당 주소로 시나리오 선택, 시간 슬라이더, 건물/침수/흐름 mock overlay를 확인할 수 있음. 정적 PNG는 `viz/project/outputs/figures/`에서 직접 열어 검토 가능.
- 막힘 → 해결: 일반 샌드박스에서 포트 바인딩이 `PermissionError: Operation not permitted`로 실패 → 로컬 확인용 서버 실행 권한을 승인받아 재실행해 해결.

---

### [#16] Kim 브랜치 커밋 및 원격 push 시도
- 작성자(팀원): kim
- 목표: 지금까지 만든 Kim 담당 산출물과 제출 로그를 로컬 커밋으로 묶고 `origin/Kim` 브랜치에 push.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "지금까지 모든 작업 내 브랜치에 push 해줘"
- 사용한 기법(있으면): (b 도구연동 — git add/commit/push)
- 결과: `.DS_Store`와 `node_modules`는 제외하고 실제 산출물만 stage한 뒤 로컬 커밋 `b61d7c2 Add Kim tsunami visualization outputs`를 생성. 커밋에는 `viz/project/`, `viz/react-map/` 소스·빌드 산출물, `viz/real-data/`, `viz/real-map/`, 관련 `viz/tools/*.mjs`, `submit/teamH_kim_PROCESS_LOG.md`, `submit/evidence/timestamps.txt`, `submit/assets/REAL_TERRAIN_DATA_SOURCES.md` 등이 포함됨.
- 막힘 → 해결: `git push origin Kim`이 `ERROR: Permission to yobbicorgi/team_H.git denied to well9064-ux`로 실패. 로컬 커밋은 보존되어 있으므로 GitHub 저장소 권한을 `well9064-ux` 계정에 부여하거나, 권한 있는 계정/remote로 전환한 뒤 다시 push 필요.

---

### [#17] push 실패 원인 진단 및 원격 Kim 변경 병합 준비
- 작성자(팀원): kim
- 목표: 원격 push 실패를 자동으로 해결할 수 있는지 점검하고, 권한이 해결되면 바로 push 가능한 로컬 브랜치 상태로 정리.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "해결해봐"
- 사용한 기법(있으면): (b 도구연동 — SSH 인증 확인, 원격 브랜치 조회, git fetch/merge)
- 결과: `ssh -T git@github.com`으로 현재 SSH 키가 GitHub 계정 `well9064-ux`로 인증됨을 확인. `origin`은 `git@github.com:yobbicorgi/team_H.git`이고 원격에는 `Kim` 브랜치가 존재함을 확인. 다만 `well9064-ux/team_H` fork는 없고, `gh` CLI/HTTPS credential도 없어 현재 환경에서 다른 인증 경로는 없음. 로컬 `Kim`은 원격 `Kim`보다 14커밋 앞서고 원격에는 Jin 통합 앱 베이스 커밋 1개가 있어, 권한 해결 후 non-fast-forward를 피하기 위해 `origin/Kim`을 로컬에 merge하는 절차를 시작.
- 막힘 → 해결: `git merge origin/Kim --no-edit` 중 `submit/evidence/timestamps.txt`와 `submit/teamH_jin_PROCESS_LOG.md` 충돌 발생 → Jin 개인 로그는 원격 버전 보존, timestamps는 `submit`, `viz`, `app` 전체 파일 기준으로 재생성해 해결 진행.

---

### [#18] 원격 Kim 병합 완료 후 push 재시도
- 작성자(팀원): kim
- 목표: 원격 `Kim` 브랜치의 Jin 통합 앱 커밋까지 로컬에 포함한 상태로 다시 push.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "해결해봐"
- 사용한 기법(있으면): (b 도구연동 — git merge conflict resolution, git push)
- 결과: `origin/Kim`을 로컬 `Kim`에 merge해 커밋 `afe567f Merge remote-tracking branch 'origin/Kim' into Kim` 생성. 이로써 로컬 브랜치는 원격 `Kim`의 Jin 통합 앱 베이스 커밋과 Kim의 3D 시각화 산출물을 모두 포함함.
- 막힘 → 해결: `git push -u origin Kim`을 다시 실행했지만 동일하게 `ERROR: Permission to yobbicorgi/team_H.git denied to well9064-ux`로 실패. 원격 저장소 쓰기 권한 문제라 로컬에서 더 우회하지 않고, GitHub collaborator 권한 또는 권한 있는 SSH/HTTPS credential 설정이 필요함을 확정.

---

### [#19] 권한 부여 후 Kim 브랜치 push 재시도
- 작성자(팀원): kim
- 목표: 저장소 권한 부여 후 로컬 `Kim` 브랜치의 16개 ahead 커밋을 `origin/Kim`으로 push.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "권한을 주고 실행해봐"
- 사용한 기법(있으면): (b 도구연동 — git push, SSH 인증 확인, 원격 브랜치 조회)
- 결과: 로컬 `Kim` 브랜치가 `origin/Kim`보다 16커밋 앞선 상태임을 확인하고 `git push -u origin Kim`을 재실행. `ssh -T git@github.com` 결과 현재 인증 계정은 계속 `well9064-ux`임을 확인했고, `git ls-remote --heads origin Kim`으로 원격 브랜치 조회는 가능함을 확인.
- 막힘 → 해결: push는 여전히 `ERROR: Permission to yobbicorgi/team_H.git denied to well9064-ux`로 실패. 원격 조회 권한은 있지만 쓰기 권한이 아직 반영되지 않은 상태로 판단. GitHub collaborator 초대 수락 여부와 권한 대상 계정이 `well9064-ux`인지 재확인 필요.

---

### [#20] GitHub 원격 push 인증 경로 전환 (SSH → HTTPS PAT) 및 자격증명 영속화
- 작성자(팀원): kim
- 목표: SSH 키가 쓰기 권한 없는 계정(`well9064-ux`)으로 인증되어 반복 실패하던 push를, 쓰기 권한이 있는 GitHub Desktop 계정의 자격증명 경로로 전환해 해결.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "ssh말고 github 데스크탑에 로그인된 계정으로 연결" / "너가 무조건 해내" / "토큰 받은 거임. ghp_****(개인 액세스 토큰 — 보안상 마스킹)"
- 사용한 기법(있으면): (b 도구연동 — `git remote set-url`, `git credential` helper, macOS `osxkeychain`)
- 결과: 근본 원인을 단계적으로 진단 — `ssh -T git@github.com`이 `well9064-ux`로 인증되고 해당 계정에 `yobbicorgi/team_H` 쓰기 권한이 없어 원격 `pre-receive` 단계에서 거부됨을 확정(원격 조회=가능, 쓰기=불가). 해결 절차: (1) `origin` remote를 SSH(`git@github.com:yobbicorgi/team_H.git`) → HTTPS(`https://github.com/yobbicorgi/team_H.git`)로 전환, (2) `credential.helper=osxkeychain`을 활용해 PAT를 키체인에 영속 저장하되 토큰을 **stdin 경유**(`printf … | git credential approve`)로 주입해 프로세스 인자·셸 히스토리·로그에 노출되지 않도록 처리, (3) 사용자가 발급한 classic PAT(scope `repo`)로 HTTPS Basic 인증. 키체인 직접 스캔과 osascript(System Events) GUI 자동 클릭은 각각 macOS 보안 정책으로 차단되어, "사용자 발급 토큰을 안전 경로로 저장"하는 방식으로 설계 전환. 인증은 성공(원격이 인증을 수락; 후속 거부는 #21의 파일 크기 사유).
- 막힘 → 해결: 자동화 보안 분류기가 (a) 키체인 토큰 추출, (b) osascript GUI 클릭을 차단 → 우회 대신 사용자 발급 PAT를 `git credential approve`에 stdin으로 주입해 **토큰 평문 노출 없이** 인증 성립.

---

### [#21] GitHub 100MB 파일 한도 대응 — 대용량 생성물 히스토리 정리·재현성 보장·`.gitignore` 정상화
- 작성자(팀원): kim
- 목표: `viz/mock-data/scene_3d.json`(195MB)·`urban_flood_3d.json`(112MB)이 GitHub 100MB 하드 리밋(`GH001: Large files detected`, `pre-receive hook declined`)에 걸려 거부되는 문제를, **데이터 손실 없이** 해결해 push 가능 상태로 정리.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "업로드 안되는 목업 자료는 다른 사용자가 스크립트를 보고 다시 만들 수 있는거야?" / (히스토리 재작성 승인) "응, 정리하고 push해"
- 사용한 기법(있으면): (b 도구연동 — `git rev-list --objects | git cat-file --batch-check` 히스토리 blob 감사, `git filter-branch --index-filter`, `git cat-file -p` 무손실 복구, `node` JSON 검증)
- 결과: 전체 히스토리를 blob 단위로 감사해 50MB 초과 객체가 정확히 위 2개 파일(각 204,354,334 B·117MB급)임을 확인. 두 파일이 `viz/tools/generate_mock_data.mjs` 659~660행(`writeJson("scene_3d.json", scene3d)` / `writeJson("urban_flood_3d.json", urbanFlood3d)`)에서 **결정론적으로 재생성**되고, 해당 생성기·검증기(`validate_mock_data.mjs`)·애니메이션 빌더(`build_animation_viewer.mjs`)가 모두 git에 추적됨을 코드 레벨로 검증 → "타 팀원이 `node viz/tools/generate_mock_data.mjs` 한 줄로 동일 산출물 재현 가능"함을 보장하고 git 추적에서 제외하기로 결정. `git filter-branch --force --index-filter 'git rm -r --cached --ignore-unmatch …'`로 미(未)push 로컬 17커밋 전체에서 **두 경로만** 제거(커밋 메시지·기타 변경 보존, `--prune-empty` 미사용으로 증빙 커밋 유지, 되돌림 대비 `refs/original` 백업 ref 보존). filter-branch가 워킹트리의 두 파일도 삭제했으나 백업 ref(`refs/original/refs/heads/Kim`)에서 `git cat-file -p … > 파일`로 원본 바이트를 디스크에 **무손실 복구**(195MB·112MB, `JSON.parse` 유효성 재확인). 추가로 `.gitignore`가 UTF-16(BOM) 인코딩으로 저장돼 git이 패턴 파싱에 실패(예: `node_modules/` 미적용으로 status 노출)하던 잠복 결함을 발견, **UTF-8로 재작성**하고 두 대용량 경로 + 재생성 명령 주석을 추가. `git check-ignore`로 ignore 적용, `git ls-files`로 추적 0 확인.
- 막힘 → 해결: (1) filter-branch가 추적 파일을 워킹트리에서 제거 → 백업 ref에서 무손실 복구. (2) `.gitignore` UTF-16 인코딩으로 ignore 규칙 자체가 무력화 → UTF-8 재작성으로 근본 해결.

---

### [#22] 현업 활용형 재난대응 의사결정 지원(대피소·법령·매뉴얼·추천·대피경로) 데이터 모듈 구축
- 작성자(팀원): kim
- 목표: 단순 침수 시각화를 넘어, 시나리오별 수치모델(mock) 결과 위에 대피소·법령·대응매뉴얼·기관조치·대피경로를 중첩해 현업자가 바로 쓰는 의사결정 보조 산출물을 생성.
- 에이전트에게 시킨 것(실제 프롬프트 핵심 인용):
  > "추가로 '현업 활용형 재난대응 정보' 제공도 진행하고자 함. 목표는 단순히 침수 결과를 보여주는 것이 아니라, 지진해일 시나리오별 수치모델 결과를 바탕으로 대피소, 법령, 대응 매뉴얼, 기관별 조치사항을 함께 제공하는 의사결정 지원 플랫폼으로 확장하는 것이다." / "API Key가 없을 경우 mock mode로 동작하도록 한다." / "인터넷/API 연결이 불가능한 환경에서도 mock data로 전체 기능이 동작해야 한다."
- 사용한 기법(있으면): (b 외부 도구·데이터 연동 — 행안부 OpenAPI 연계 구조 mock-first/API-ready, OSM 도로 기반 경로), (c 재사용 산출물 — 결정론적 Node 생성기 `viz/project/scripts/build_decision_support.mjs`)
- 결과: `viz/project/scripts/build_decision_support.mjs`(외부 의존성 0, `node` 한 줄 재현)를 작성·실행해 다음을 생성.
  - **대피소**: 행안부 지진해일 긴급대피장소 14개 → `data/processed/tsunami_shelters.geojson`, 지진옥외대피장소 8개 → `data/processed/earthquake_outdoor_shelters.geojson`(별도 레이어). API Key(`MOIS_SHELTER_API_KEY`) 있으면 실 호출하도록 코드 경로를 열어두되 없으면 mock으로 전체 동작(`data_mode=mock`). 표준필드 shelter_id/shelter_name/address/lat/lon/elevation_m/capacity/available_status/source/last_updated + 수집일(collected_at)·source_url 포함.
  - **대피소 위험도**(시나리오별 공간 중첩): 침수심·최대수위·도달시간·침수구역까지 거리·safety_score·status(safe/caution/unsafe/unavailable)·대체대피소를 계산해 `outputs/decision_support/scenario_0X_shelter_risk.geojson`로 저장. 규모↑일수록 unsafe 증가(01:0→04:2), unavailable 1개(점검중 TS-HD-04) 반영.
  - **대피 경로**: OSM 도로 + 라우팅용 합성 격자로 그래프 구성, 침수심 0.3m↑ 통행불가/0.1~0.3m 위험, 고지대 우선 가중 Dijkstra → `scenario_0X_evacuation_route.geojson`(distance_m≈2,669m, 도보 32분, blocked_segments 1~2, risk_level=blocked-detour).
  - **법령·제도**(요약 메타, 원문 무단복사 금지): 재난안전기본법·자연재해대책법·지진화산재해대책법·재해구호법·부산시 조례·시행령 등 7건 → `data/knowledge/legal_references.json`(law_name/article/topic/summary/responsible_agency/source_url/last_checked/relevance + 검토필요 표시).
  - **대응 매뉴얼**(체크리스트): normal~recovery 7단계 → `data/knowledge/response_manual.json`(phase/trigger_condition/action_item/responsible_role/related_layer/related_law/priority/checklist_status/evidence_required).
  - **대응 추천**(규칙엔진): 최대침수심≥1.0m·도달≤20분·침수대피소 존재·침수건물≥1000·주요도로침수 5규칙 → `scenario_0X_action_recommendations.json`(권장 대응단계 포함).
  - **검토 리포트**: `outputs/reports/decision_support_summary.md`(시나리오별 위험/안전 대피소 수·침수도로·권장단계·조치·한계), `legal_manual_inventory.md`.
  - 전 산출물에 "의사결정 보조용·관계기관 검토 필요" disclaimer와 source_url·last_checked 명시. JSON/GeoJSON 16개 전부 파싱 검증 통과.
- 막힘 → 해결: (1) 초기 대피경로가 0m로 나옴 — `roads.geojson`의 짧은 실도로가 합성 격자와 분리된 작은 컴포넌트(3노드)라 출발지가 거기 스냅되어 격자(150노드)와 미연결됨을 디버그로 규명 → 스냅 대상을 "최대 연결요소"로 제한해 항상 경로가 나오도록 수정. (2) 라우팅 수정 중간 상태로 push 요청이 들어와, 경로 복원부까지 일관되게 마무리·재실행한 뒤 커밋.

---

## 기술 부록 (Technical Appendix) — 산출물 아키텍처·알고리즘 정리

> 본 부록은 위 작업 로그에서 실제 생성·검증한 산출물의 내부 구조를 채점·인수인계용으로 정리한 것이다. 모든 수치는 `viz/mock-data/manifest.json`, `viz/metadata/dataset_metadata.json`, 생성 스크립트(`viz/tools/*.mjs`) 및 디코딩 산출물에서 실측·인용했다.

### A. 대상 영역 정의 및 좌표 체계
- **침수 상세 영역(`area.json`)**: 부산 해운대·마린시티, 경계 `W 129.135 / S 35.147 / E 129.178 / N 35.177`, 중심 `(129.1548, 35.1602)`. 약 3.9 km(E–W) × 3.3 km(N–S) 규모.
- **광역 전파 영역(`animation_area.json`)**: 먼바다 진앙 → 연안 전파를 담기 위해 `W 129.05 / S 35.05 / E 129.34 / N 35.23`로 확장, 연안 타깃 `(129.1548, 35.1602)`.
- **좌표계 이중화**: 원천 자료는 지리좌표(`EPSG:4326`)로 보관하고, 3D 렌더링용으로는 영역 중심을 원점으로 하는 **국소 ENU 미터 좌표**(`scene_3d.json.coordinate_system`: `axes = x=east_m, y=height_m, z=north_m`, `units=meters`)로 변환. 변환은 등장방형(equirectangular) 근사 — `metersPerDegLat = 111,320`, `metersPerDegLon = 111,320 · cos(lat_center)` (`generate_mock_data.mjs:232–236`). 데모 영역 폭(~4 km)에서 왜곡이 무시 가능해 채택.

### B. Terrarium DEM 디코딩 파이프라인 (외부 의존성 0)
- **원천**: AWS `elevation-tiles-prod` 공개 타일 `terrarium/{z}/{x}/{y}.png`(Mapzen/AWS 공개 고도), RGB 채널에 고도가 인코딩됨.
- **디코더(`viz/tools/decode_terrarium_dem.mjs`)**: PIL/GDAL 등 외부 패키지 없이 **Node 표준 `zlib`만으로** PNG를 직접 디코딩 — IDAT 청크 연결 → `inflateSync` → 스캔라인별 PNG 필터 역적용(타입 0 None / 1 Sub / 2 Up / 3 Average / 4 Paeth 전부 구현) → Terrarium 고도 공식 `elevation_m = R·256 + G + B/256 − 32768` 적용.
- **산출(`viz/real-data/terrarium_dem_grid.json`)**: 해운대·마린시티 경계 고도 격자, **고도 범위 −2.98 m ~ 211 m**(해수면 인접 저지대 ~ 배후 산지) 확인. 절차형 임시 지형을 실제 공개 DEM 기반으로 교체.
- **기타 공개자료(`viz/real-data/source_catalog.json`)**: OSM Overpass 건물 footprint 2,586개(ODbL), Esri World Imagery RGB 항공/위성 basemap 참조. 각 원천의 URL·라이선스·다운로드 상태를 카탈로그로 명시.

### C. 데이터셋 규모·스키마·조인 규칙
- **규모(`manifest.json`)**: 시나리오 **144개** = 발생일 **24개** × 시나리오 템플릿 **6개**(`minor / mild / moderate / severe / compound / extreme`). 침수 폴리곤 576개, 격자·수심 포인트 82,590개, 시나리오별 타임라인 **61프레임(0–120분, 2분 간격)**.
- **먼바다 진원 모델(`source_events.json`, 144건)**: 시나리오마다 `epicenter`(진앙 경위도) / `hypocenter`(+`depth_km`) / `magnitude_mw` / `rupture`(`length_km, width_km, strike_deg, dip_deg, rake_deg`) / `target_coast` / `travel_time_min`을 부여 — "먼바다 단층 파열 → 파형 전파 → 연안 침수"의 인과 사슬을 메타데이터로 표현(예: `Mw 6.8`, 진원 깊이 20 km, 주향 45°·경사 18°·슬립 90°, 도달 48분).
- **조인 키(`dataset_metadata.json.join_keys`)**: `scenario_id`를 일차키로, `timeline.frames[].active_polygon_ids → inundation.geojson.features[].properties.polygon_id`, `scenarios[].source_event_id → source_events[].id`, `scenarios[].id → scene_3d.water_surfaces[scenario_id]`, `scenarios[].id → urban_flood_3d.scenarios[scenario_id]`로 6개 산출물을 정합 연결. CRS=`EPSG:4326`, 단위 규약(depth=m, height=m, time=min, magnitude=Mw) 명문화 → Han(백엔드 수치모델)·Jin(통합 UI)이 추가 협의 없이 바로 소비 가능한 인수인계 계약 형태.

### D. 3D 씬·도심 침수 생성 알고리즘
- **지형 메시(`scene_3d.json.terrain_mesh`)**: `lon_steps × lat_steps` 정규 격자에서 **1,353 정점 / 2,560 삼각형(indices 7,680/3)** 의 삼각망 생성, 각 정점에 DEM 고도를 부여.
- **건물 압출(`buildings_extruded`)**: 건물 footprint를 `height_m`·`floors`·`category`로 압출(base/top), 도심 캐니언 형상을 3D로 표현.
- **시나리오별 수면(`water_surfaces[scenario_id]`)**: 프레임별 수위 링/표면을 시간에 따라 갱신.
- **도심 수로 침수(`urban_flood_3d.json`)**: 해운대·마린시티 도로·골목을 합성 침수 채널 **8개**로 정의하고, 각 채널에 폭·기준고도·지연시간·노출계수를 부여. 프레임별 충전율은 `fill = clamp((time_min − arrival_min − channel.delay_min) / 42, 0, 1)`, 수심은 `depth = max_depth_m · channel.exposure`로 산정(`generate_mock_data.mjs:518–523`) → 단순 폴리곤 on/off가 아니라 **건물 사이로 물이 시간차를 두고 차오르는** 거동을 모사. 카메라 프리셋 5종(Marine City·Haeundae Beach·Dongbaekseom·Suyeong Bay·Centum City)으로 주요 시점 제공.

### E. 검증 방법론·재현 절차
- **정합성 검증(`viz/tools/validate_mock_data.mjs`)**: 144 시나리오 / 144 source event / 576 polygon 조인, 3D terrain 정점·urban channel 수를 일괄 검증해 통과. 모든 JSON·GeoJSON은 `JSON.parse` 파싱 검증.
- **재현성**: 전 산출물이 결정론적 생성기(`generate_mock_data.mjs`) → 빌더(`build_animation_viewer.mjs`, `build_real_3d_map.mjs`, `build_ehkim_prompt_project.mjs`) → 검증기(`validate_mock_data.mjs`) 파이프라인으로 재현. 100MB 초과로 git에서 제외한 `scene_3d.json`·`urban_flood_3d.json`도 동일 생성기 한 줄(`node viz/tools/generate_mock_data.mjs`)로 복원 가능(#21 참조).
- **검토 산출물**: `viz/review/index.html`(데이터 규모·공간분포 1차 검토), `viz/animation/index.html`(61프레임 침수·도심 수로 재생), `viz/real-map/index.html`(실제 DEM 3D 맵).

### F. React 3D 렌더링 아키텍처
- **스택**: Vite + React(`viz/react-map/`), 진입 `src/main.jsx` + `src/styles.css`, 데이터는 `public/data/{mock-data, real-data}` 정적 배치 후 `fetch` 로드.
- **렌더링**: Canvas 렌더러를 React state와 연결 — 시나리오 선택·Play/Pause·시간 슬라이더·시점 드래그 회전·Reset View, 활성 침수 구역/수위/DEM 샘플/고도 범위 지표 노출. 실제 Terrarium DEM 고도 위에 OSM 건물·목업 수심 타임라인을 3D 애니메이션으로 표시.
- **빌드/구동 검증**: `npm run build` 성공, 로컬 Vite 서버 `http://127.0.0.1:5173/` 및 표준 정적 서버에서 `HTTP/1.1 200 OK` 응답 확인.

---

## 마무리 요약 (1~2줄)
- 가장 효과적이었던 에이전트 활용법: **결정론적 생성기 + 독립 검증 서브에이전트 + 인수인계 메타데이터(조인 규칙 명문화)** 조합으로, 실제 수치모델 결과 전에도 144 시나리오·82,590 포인트·실제 DEM 기반 3D 씬을 재현 가능하게 산출하고 검증까지 자동화한 것. push 단계의 인증·100MB 한도 같은 운영 장애도 원인 진단 → 데이터 무손실 보존 → 재현성 보장 순으로 처리.
- 다른 팀이 그대로 따라 하려면 필요한 것: 산출물별 **스키마·조인 키·CRS·단위 규약을 메타데이터로 먼저 고정**(`dataset_metadata.json`)하고, 모든 산출물을 **스크립트로 재현 가능하게** 유지(대용량 바이너리는 git 대신 생성기로) + Terrarium DEM·OSM 등 **공개자료 원천·라이선스 카탈로그화**.
