# teamH 협업 가이드 — 에이전트로 pull/push & 역할 작업 (팀원용)

> 대상: teamH 팀원 3명(Jin·Han·Kim). 각자 **본인 PC·본인 계정**으로 작업.
> 핵심: **git 명령을 몰라도 됩니다.** 쓰고 있는 에이전트(Claude Code / Codex / Cursor)에게 **말로 시키면** 알아서 pull/commit/push 해 줍니다.
> 저장소: `https://github.com/yobbicorgi/team_H.git`
> 컨벤션: **각자 본인 브랜치(`Jin`/`Han`/`Kim`)에서 작업·push → 준비되면 `main`에 병합.** 본인 브랜치엔 혼자만 올리니 충돌이 안 납니다.

---

## 0. 처음 한 번만 — 저장소 받기(클론)
에이전트에게 그대로:
> **"이 주소 클론해줘 → https://github.com/yobbicorgi/team_H.git , 그리고 그 폴더로 들어가서 시작하자"**

(명령어로 직접 하려면)
```bash
git clone https://github.com/yobbicorgi/team_H.git
cd team_H
```
클론한 뒤 **본인 브랜치로 전환**(처음 1번):
> **"내 브랜치 `Han`(또는 Kim)으로 전환해줘 (git checkout Han)"**
```bash
git checkout Han      # 본인 브랜치(Jin/Han/Kim)로 이동. 이후 작업은 여기서.
```
- 클론하면 `CLAUDE.md`(작업 규칙)가 **자동 로드**되고, 처음에 에이전트가 **팀명·본인 이름**을 물어봅니다 → "teamH" + 본인 이름(jin/han/kim)으로 답하면 본인 `submit/teamH_<이름>_PROCESS_LOG.md`가 만들어집니다.
- 인증을 자꾸 물으면 **GitHub Desktop**(desktop.github.com) 로그인 한 번이 제일 편합니다. (또는 Personal Access Token)
- git 사용자 정보 에러가 나면 에이전트에게: **"이 저장소에 내 git 이름/이메일 설정해줘 (이름=Han, 이메일=내깃헙이메일)"**

---

## 1. 매번 작업 루틴 — **본인 브랜치에서** 받고 → 만들고 → 올리기

> ✅ 항상 **본인 브랜치(Jin/Han/Kim)** 위에 있는지 확인하세요. (에이전트에게 "지금 무슨 브랜치야?" → 아니면 "내 브랜치로 바꿔줘")

| 단계 | 에이전트에게 말로 | 명령어(직접 할 때) |
|---|---|---|
| ① 작업 **전** | **"내 브랜치 최신으로 맞춰줘 (git pull)"** | `git pull` |
| ② 작업 | 본인 역할 폴더에서 에이전트와 작업 | — |
| ③ 작업 **후** | **"방금 작업 내 브랜치에 올려줘 — add, commit, push까지"** | `git add -A && git commit -m "한 줄 설명" && git push` |

> 본인 브랜치엔 **나 혼자** 올리므로 `rejected`·충돌이 사실상 안 납니다. (main 직접 push가 아니라 안전정책 차단도 없음)

### main에 합치기 (병합) — 작업이 어느 정도 되면
혼자 다 만들고 끝낼 필요 없이, 의미 있는 단위가 되면 main에 합쳐 공유합니다. **에이전트에게 시키는 게 가장 쉽습니다**:
> **"내 브랜치(Han)를 main에 병합해서 올려줘. 충돌 나면 알려주고."**

(또는 GitHub 웹에서 **Pull Request**: `…/team_H/pull/new/Han` → Create → Merge. 클릭만으로 됨.)
- 합치기 전 최신 main을 반영하려면: **"main 최신 내용을 내 브랜치로 가져와줘 (merge main)"**.
- 병합 충돌이 나면 무리하지 말고 주장(Jin)이나 에이전트에게 **"충돌 해결해줘"**.

---

## 2. 충돌 0으로 만드는 규칙 (꼭 지키기)
1. **본인 로그만 본인이**: `submit/teamH_<이름>_PROCESS_LOG.md` 는 각자 자기 것만. (서로 안 건드림)
2. **코드는 본인 역할 폴더만**: Jin=`backend/`, Han=`app/`, Kim=`viz/`. 서로 다른 폴더라 충돌 안 남.
3. **공통 문서**(`PLAN.md`, `submit/BEFORE_AFTER.md`, `submit/CHECKLIST.md`, `submit/assets/`)는 **되도록 담당자 1명**이 갱신하고 바로 push. 꼭 함께 고쳐야 하면 **작업 전 `pull` → 끝나면 즉시 `push`**.
4. **PROCESS_LOG만 개인별, 그 외 submit·코드는 전부 공통**으로 push해 공유합니다.

---

## 3. 역할별 작업 — 에이전트에게 시킬 일

각자 **본인 폴더**에서, 첫 세션에 에이전트가 팀명·이름을 물으면 답하고(→ 본인 PROCESS_LOG 생성), 아래를 출발점으로 시키세요. 의미 있는 단계마다 에이전트가 본인 로그에 자동 기록합니다.

### 👤 Jin — 백엔드 오케스트레이션 (`backend/`)
> **"`submit/assets/STEP_ANALYSIS.md`의 10단계 분석을 근거로, 파라미터(JSON 스키마)를 받아 단계별 Config를 생성하고 10단계를 순차 실행하는 파이프라인 골격을 `backend/`에 만들어줘. 실제 모델 실행은 Mock으로 두고, 파라미터→Config→실행준비까지 동작하게 해줘. 프론트와 쓸 REST API 계약도 정의해줘."**

### 👤 Han — 프론트엔드 / 파라미터 폼 + 에이전트 채팅 (`app/`)
> **"Next.js 앱을 `app/`에 만들고, 좌측에 파라미터 입력 폼(지역/SSP/near·far/케이스 등)과 [실행] 버튼·진행상태를 넣어줘. 그리고 채팅으로 파라미터를 설정하면 폼이 자동으로 채워지는 에이전트 패널을 붙여줘(모델 실행은 안 함, 셋팅값만). 백엔드 API 계약은 Jin이 정의한 걸 따르자."**

### 👤 Kim — 3D 침수 시각화 (`viz/`)
> **"`viz/`에 부산권(마린시티·해운대) 3D 씬을 만들어줘. 위성/항공 basemap 위에 3D 건물과 지형고도를 얹고, 침수 결과(grid 또는 GeoJSON)를 오버레이로 표시해 시나리오끼리 비교할 수 있게 해줘. 라이브러리는 CesiumJS/deck.gl/three.js 중 적합한 걸 골라 PoC부터."**

> 상세 설계·인터페이스는 루트 **`PLAN.md`** 참고(아키텍처·API 계약·마일스톤·역할분담).

---

## 4. 마무리 체크 (각자)
- 본인 `submit/teamH_<이름>_PROCESS_LOG.md` 가 단계별로 채워졌는지 → 에이전트에게 **"방금 작업 로그에 남겨줘"**.
- 작업 끝나면 **올리기**(1번 ③). 제출 직전엔 주장(Jin)이 **"깃헙 최신 다 받아줘(pull)"** 로 전원 작업을 취합 → 폴더째 압축 제출.
