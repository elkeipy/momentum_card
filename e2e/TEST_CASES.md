# Momentum Card 테스트 케이스 (Playwright)

이 파일을 전달받고 `테스트해줘`라는 말을 들으면, 아래 **실행 규칙**대로 모든 케이스를 순서대로 실행하고 **결과 보고**를 남긴다. 소스 코드는 고치지 않는다. 커밋하지 않는다.

- 대상: 이 저장소의 앱 (CRA, 포트 3000)
- 도구: Playwright MCP (`browser_navigate`, `browser_run_code_unsafe`, `browser_snapshot`, `browser_click`, `browser_network_requests`, `browser_console_messages` 등)
- 기준 문서: `README.md` (기능 명세), 소스는 `src/` 아래
- 기존 자동화 테스트(`e2e/app.spec.ts`)와 겹치는 케이스도 이 문서가 기준이다. 다시 수행한다.

---

## 0. 실행 규칙

### 0.1 순서

1. **Phase 0, 정적 점검.** 프로젝트 루트에서 `npm run typecheck`, `npm test -- --watchAll=false`, `npm run test:e2e`를 차례로 실행하고 통과 여부만 기록한다. 실패해도 다음 단계로 넘어간다.
2. **서버 준비.** `http://localhost:3000/`이 응답하지 않으면 `BROWSER=none npm start`를 백그라운드로 띄우고 응답할 때까지 기다린다. 이 세션에서 띄웠다면 마지막에 종료한다. (README는 `/momentum_card`라고 적지만 개발 서버는 루트 `/`에서 열린다. 2026-11-11 확인.)
3. **Phase 1, 일반 케이스.** 섹션 3부터 12까지(BRD, CARD, SET, WTH, CLK, POM, QTE, WRD, TDO, NTF, THM) 중 `⏱`가 **없는** 케이스.
4. **Phase 2, 시간 제어 케이스.** 제목에 `⏱`가 붙은 케이스 전부. Phase 1이 끝난 뒤 `browser_close`로 컨텍스트를 새로 만들고 §0.4대로 시계를 한 번만 설치한 다음 섹션 순서대로 몰아서 실행한다.
5. **Phase 3, 견고성·반응형.** 섹션 13. 시계를 설치하지 않은 새 컨텍스트에서 한다.

### 0.2 공통 준비 (Phase 1 시작 전에 한 번)

이 문서의 케이스는 **한국어 화면**을 기준으로 쓰여 있다. 화면 언어는 브라우저 언어(첫 언어가 `ko`일 때만 한국어)와 `localStorage['momentum-lang']`로 정해진다. 영어 브라우저(Playwright 기본 `en-US`)로 열면 영어 화면이 뜨므로, 컨텍스트를 만들 때 `locale: 'ko-KR'`을 주거나 첫 로드 전에 `momentum-lang`을 `ko`로 저장한다. 언어 케이스(I18N)만 예외다.

`browser_resize`로 1280×900을 맞추고, `browser_run_code_unsafe`로 아래를 실행한다. 외부 API는 항상 목으로 막는다. 실제 외부 서버에 요청을 보내지 않는다.

```js
async (page) => {
  const ctx = page.context();
  await ctx.grantPermissions(['geolocation']);
  await ctx.setGeolocation({latitude: 37.5665, longitude: 126.978});
  await page.route('**/api.open-meteo.com/**', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({current: {temperature_2m: 21.5, apparent_temperature: 20.1}})}));
  await page.route('**/api.bigdatacloud.net/**', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({city: '서울'})}));
  await page.route('**/api.dictionaryapi.dev/**', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{meanings: [{definitions: [{definition: 'steady attention'}]}]}])}));
  await page.route('https://ntfy.sh/**', r => r.fulfill({status: 200, body: 'ok'}));
  await page.route('https://calendar.google.com/**', r => r.fulfill({status: 200, body: 'ok'}));
}
```

### 0.3 상태 초기화·시드

- 각 케이스는 따로 적지 않으면 **초기화에서 시작**한다.
  `page.goto('http://localhost:3000/')` → `page.evaluate(() => localStorage.clear())` → `page.reload()`
- 시드가 필요한 케이스는 `localStorage.setItem(...)` 후 `page.reload()`한다. `addInitScript`는 쓰지 않는다. 같은 페이지에 계속 남기 때문이다.
- 목 응답을 바꿀 때는 `page.unroute(패턴)` 후 `page.route(...)`를 다시 건다. 바꾼 뒤에는 §0.2 상태로 되돌린다.

### 0.4 시간 제어 (Phase 2 전용)

```js
async (page) => {
  await page.clock.install({time: new Date('2026-11-11T10:00:00')});
  await page.goto('http://localhost:3000/');
}
```

- 설치는 새 컨텍스트에서 **한 번만** 한다. 이후 시간은 `page.clock.runFor(ms)`로 흘린다. 기준 시각은 로컬 시간 10:00:00이다.
- 케이스마다 초기화하려면 `localStorage.clear()` 후 `page.reload()`한다. 시계 설치는 유지된다.
- 시계가 설치된 상태에서는 설정 모달을 열고 닫는 등 평소 조작도 그대로 된다.
- 시계 제어가 앱과 맞지 않아 케이스를 진행할 수 없으면 `SKIP`으로 두고 이유를 적는다. 절차를 꾸며서 통과시키지 않는다.

### 0.5 보조 확인

- **콘솔.** 케이스 묶음(섹션)이 끝날 때마다 `browser_console_messages`(level: error)를 확인한다. 에러가 있으면 해당 섹션의 마지막 케이스에 FAIL로 기록한다.
- **ntfy 요청.** `browser_network_requests`(filter: `ntfy.sh`)와 `browser_network_request`(part: request-body)로 URL과 본문을 읽는다.
- **스크린샷.** `🖼` 표시가 있는 케이스에서 찍는다. 저장 위치는 `screenshots/<YYYY-MM-DD>/<케이스ID>.png`다. 폴더가 없으면 만든다. 이 폴더는 `.gitignore` 대상이다. 실패한 케이스는 표시가 없어도 반드시 찍는다.
- **드래그.** 카드 헤더(`region > header`)의 중앙 좌표를 구해 `page.mouse.move/down/move(steps)/up`으로 끈다. 헤더 안의 버튼 위에서 시작하지 않는다. 크기 조절 손잡이는 `[class*="resize"]`다.
- **위치 확인.** `region.boundingBox()`와 `localStorage['feature-card:<id>']`로 읽는다.

### 0.6 판정

- `PASS`: 기대 결과를 모두 만족한다.
- `FAIL`: 하나라도 어긋난다. 실제 값, 기대 값, 스크린샷 경로를 적는다.
- `SKIP`: 환경 때문에 수행할 수 없다. 이유를 적는다.
- `INFO`: 기록용 관찰이다. 판정하지 않는다.
- FAIL이 나도 **멈추지 않고** 다음 케이스를 진행한다. 앞 케이스의 FAIL 때문에 뒤 케이스를 못 하면 SKIP으로 둔다.

### 0.7 결과 보고

1. `screenshots/<YYYY-MM-DD>/test-report.md`에 저장한다. 같은 날 다시 하면 `test-report-2.md`처럼 번호를 붙인다.
2. 구성은 다음과 같다.
   - 요약 한 줄: 전체/PASS/FAIL/SKIP 개수, Phase 0 결과
   - 표: `ID | 우선순위 | 결과 | 비고(FAIL/SKIP 사유, 스크린샷 경로)`
   - FAIL 상세: 재현 절차, 기대, 실제
3. 대화에는 **요약과 FAIL 목록만** 알려 주고 보고서 경로를 덧붙인다.
4. 끝나면 이 세션에서 띄운 개발 서버를 종료한다.

---

## 1. 화면 요소 사전

| 대상 | 찾는 법 |
|---|---|
| 카드 | `getByRole('region', {name: '날씨' \| '시계' \| '뽀모도로' \| '명언' \| '단어' \| '할 일'})` |
| 카드 속성 | `data-pinned`(true/false), `data-placed`, 뽀모도로는 `data-tone`(focus/break/lost) |
| 카드 버튼 | `<카드이름> 설정` / `<카드이름> 고정`(`aria-pressed`) / `<카드이름> 닫기` |
| 상단 | `header.mast`, 제목 `This session`, 부제 `.mast-sub`, `언어` select(`한국어`/`English`), `테마` select, `푸시 알림`, `카드 목록`(`aria-expanded`) |
| 카드 목록 메뉴 | `menuitemcheckbox`(`aria-checked`) 6개 |
| 설정 모달 | `dialog` 이름: `날씨 설정`/`시계 설정`/`구간 길이`(뽀모도로)/`명언 설정`/`단어 설정`/`할 일 설정`/`푸시 알림`. 버튼 `Save`, `Close` |
| 스텝 필드 | `<라벨> 줄이기` / `<라벨> 늘리기` 버튼과 `spinbutton`. 라벨: Font Size, Refresh (sec), Focus Time, Short Break, Long Break, Long Break Interval, Timer Text |
| 뽀모도로 | 시간 텍스트, `progressbar '구간 진행'`, `h3`(상태), 버튼 `Start`/`Pause`, `Stop Alarm`, `list '오늘 시간 요약'`, 표 `caption '집중 이력'` |
| 명언·단어 | `progressbar '명언 남은 시간'`/`'단어 남은 시간'`, `명언 새로고침`/`단어 새로고침` |
| 단어 | 입력 `단어 추가`, 버튼 `추가`, `전체 목록`, `<단어> 삭제` |
| 할 일 | 입력 `할 일 추가`, `마감 시`/`마감 분`, `일정 날짜`/`일정 시각 (비우면 종일)`, 체크박스(이름=항목 글자), `<글자> 삭제`, `<글자> 수정`, `progressbar '<글자> 마감'` |
| 알람 | `region '할 일 알람'`, `status '할 일 알람 <글자>'`, 버튼 `확인` |

`localStorage` 키: `feature-card:<weather|clock|pomodoro|quote|words|todos>`, `visible-cards`, `card-settings:<weather|clock|quote|words|todos>`, `PomodoroSettings`, `PomodoroTimerTextSize`, `PomodoroFocusData`, `todoList`, `wordList`, `ntfy-topic`, `momentum-theme`, `momentum-lang`

한도 요약: 글자 크기 12–72, 새로고침 5–600초, 뽀모도로 집중 1–60·짧은 휴식 1–30·긴 휴식 1–30·간격 1–10·타이머 글자 24–128(기본 80), 단어 20개·40자, 할 일 40개·80자, ntfy 토픽 `[A-Za-z0-9_-]` 64자, 카드 최소 220×140, 붙는 거리 8px.

---

## 2. 케이스 목록

범례: 우선순위 P0(핵심) · P1(중요) · P2(보조) / ⏱ 시간 제어(Phase 2) / 🖼 스크린샷

---

## 3. BRD 보드·상단

### BRD-01 첫 화면 P0 🖼
- 절차: 초기화 후 로드.
- 기대: 제목 `Momentum`, 헤딩 `This session`, 카드 6개(날씨·시계·뽀모도로·명언·단어·할 일)가 모두 보인다. `html`에 `data-theme`가 없다. 콘솔 에러가 없다. 모든 카드 상단이 `header.mast` 아래에 있다.

### BRD-02 오늘 요약 문장 P1
- 절차: 초기화 직후 부제를 읽는다. 이어서 `PomodoroFocusData`를 `{dateId: <오늘 Y-M-D, 월·일 0 없이>, focusCount:1, focusPeriod:['Focus,09:00:00,09:25:00','Lost,09:30:00,09:32:00']}`로 시드하고 reload한다.
- 기대: 처음에는 `오늘 집중 0분 · YYYY-MM-DD`(월·일은 두 자리). 시드 뒤에는 `오늘 집중 25분, 놓친 2분 · YYYY-MM-DD`. Lost가 0이면 `놓친` 문구가 없다.

### BRD-03 카드 목록 메뉴 P0
- 절차: `카드 목록` 클릭 → 항목 확인 → `Esc` → 다시 열고 버튼을 다시 클릭.
- 기대: 열리면 `aria-expanded=true`, 항목 6개가 모두 `aria-checked=true`. `Esc`나 버튼 재클릭으로 닫힌다.

### BRD-04 카드 닫기와 복원 P0
- 절차: `날씨 닫기` → 메뉴에서 `날씨` 항목 확인 → 클릭.
- 기대: 닫으면 날씨 region이 DOM에서 사라지고 항목은 `aria-checked=false`. 다시 켜면 날씨가 나타나고 z-index가 다른 카드(뽀모도로)보다 크다(맨 앞).

### BRD-05 보이는 카드 저장 P1
- 절차: 날씨·단어를 닫는다 → `localStorage['visible-cards']` 확인 → reload.
- 기대: 저장값이 `["clock","pomodoro","quote","todos"]`와 같은 형태(닫지 않은 카드만, 6종 id 중). reload 뒤에도 날씨·단어가 없다.

### BRD-06 전부 닫기 P2
- 절차: 6개 카드를 모두 닫는다 → 메뉴로 하나 복원.
- 기대: 모두 닫아도 에러 없이 상단만 남는다. 하나 켜면 그 카드만 나타난다.

### BRD-07 잘못된 visible-cards P2
- 절차: `visible-cards`를 `not json`으로 시드하고 reload.
- 기대: 에러 없이 6개 카드가 모두 보인다.

---

## 4. CARD 카드 이동·크기·고정

### CARD-01 헤더 드래그로 이동 P0 🖼
- 절차: 시계 헤더 제목을 잡고 (+300, +160)만큼 끈다 → reload.
- 기대: 카드가 끈 만큼(±스냅 8px) 움직이고 크기는 그대로. `feature-card:clock`에 `placed:true`와 새 좌표가 저장된다. reload 뒤에도 같은 위치.

### CARD-02 헤더 버튼에서는 끌리지 않는다 P1
- 절차: 시계의 `설정` 버튼 위에서 pointerdown → 200px 이동 → pointerup → 모달 닫기.
- 기대: 카드 위치가 변하지 않는다.

### CARD-03 크기 조절 P0
- 절차: 날씨 오른쪽 아래 손잡이를 (+100, +80) 끈다. 이어서 (−600, −600) 끌어 최소 크기를 만든다.
- 기대: 늘린 만큼 커진다. 최소 너비 220, 최소 높이 140 아래로 내려가지 않는다. 저장값에 반영된다.

### CARD-04 화면 밖으로 나가지 않는다 P0
- 절차: 날씨를 왼쪽 위(−2000, −2000)와 오른쪽 아래(+3000, +3000)로 차례로 끈다.
- 기대: 항상 `x >= 0`, `y >= header.mast 아래`, `x + width <= 뷰포트 너비`, `y + height <= 뷰포트 높이`. 드래그 후에도 헤더를 다시 잡을 수 있다(`elementFromPoint`가 헤더 안).

### CARD-05 다른 카드에 붙기 P1
- 절차: 날씨를 한 번 옮겨 `placed`로 만든다. 시계 왼쪽 변이 날씨 오른쪽 변 + `--gap`(`getComputedStyle(documentElement).getPropertyValue('--gap')`, 기본 16)보다 5px 더 오른쪽에 오도록 끈다.
- 기대: 놓은 뒤 시계 왼쪽 = 날씨 오른쪽 + gap (±1px). 반대로 8px보다 멀리 두면 붙지 않는다(원래 놓은 위치).

### CARD-06 크기 조절도 붙는다 P2
- 절차: 날씨 오른쪽 변이 시계 왼쪽 변에서 5px 떨어지게 크기를 조절한다.
- 기대: 오른쪽 변이 시계 왼쪽 변(또는 그 옆 gap 자리)에 붙는다. 8px 넘게 떨어지면 붙지 않는다.

### CARD-07 고정 P0
- 절차: `시계 고정` 클릭 → 헤더 드래그 시도 → 손잡이 확인 → 다시 `시계 고정` 클릭 → 드래그.
- 기대: 고정되면 `aria-pressed=true`, `data-pinned=true`, 손잡이 요소가 없고 드래그해도 위치가 변하지 않는다. 해제하면 다시 움직이고 손잡이가 생긴다.

### CARD-08 고정 상태 저장 P1
- 절차: 날씨를 고정 → reload.
- 기대: reload 뒤에도 `aria-pressed=true`, 드래그 불가.

### CARD-09 눌러서 맨 앞으로 P1
- 절차: 겹치는 두 카드를 만들고(한 카드를 다른 카드 위로 끈다), 아래 카드 헤더를 클릭한다.
- 기대: 클릭한 카드의 z-index가 더 커진다.

### CARD-10 창 크기를 줄이면 다시 끼워 넣는다 P1
- 절차: 우측 아래에 둔 카드가 있는 상태에서 `browser_resize`를 800×600으로 줄인다.
- 기대: 카드가 뷰포트 안(`x+width <= 800`, `y+height <= 600`)으로 다시 들어온다.

### CARD-11 깨진 레이아웃 저장값 P2
- 절차: `feature-card:weather`를 `{"x":"a"}`, 이어서 `not json`으로 시드하고 reload.
- 기대: 에러 없이 기본 위치로 그려진다.

### CARD-12 헤더 버튼 접근성 P2
- 절차: 6개 카드마다 `설정/고정/닫기` 버튼의 접근 이름을 확인한다.
- 기대: 이름이 `<카드이름> 설정/고정/닫기`로 모두 존재한다.

---

## 5. SET 설정 모달 공통

### SET-01 모달 열기 P0 🖼
- 절차: 카드 6개의 설정 버튼을 차례로 눌러 모달 이름을 확인하고 `Close`로 닫는다.
- 기대: 각각 `날씨 설정`, `시계 설정`, `구간 길이`, `명언 설정`, `단어 설정`, `할 일 설정` 이름의 `dialog`(`aria-modal=true`)가 뜬다. 모달은 모든 카드 위에 있다(오버레이 z-index > 100).

### SET-02 닫는 방법 P0
- 절차: 시계 설정에서 Font Size를 바꾼 뒤 (a) `Close`, (b) `Esc`, (c) `Save`로 각각 닫는다.
- 기대: (a)(b) 닫히고 값은 저장되지 않는다. 카드 글자도 원래 크기로 돌아간다. (c) 저장되고 닫힌다.

### SET-03 글자 크기 미리보기와 저장 P0
- 절차: 시계 설정에서 `Font Size 늘리기`를 눌러 25로 만든다 → 카드 숫자 크기 확인 → Save → reload.
- 기대: 저장 전에도 카드에 25px로 미리 보인다. 저장 뒤 `card-settings:clock`이 `{"fontSize":25,...}`. reload 뒤에도 25px. 기본값은 시계·날씨 24, 명언·단어·할 일 16.

### SET-04 스텝 한계 P1
- 절차: Font Size를 12까지 줄이고 72까지 늘린다.
- 기대: 12에서 `줄이기`가 disabled, 72에서 `늘리기`가 disabled.

### SET-05 범위 밖·잘못된 입력 무시 P1
- 절차: Font Size 칸에 `1000`, `5`, `abc`, `1.5`를 차례로 입력한다.
- 기대: 범위 밖·비정수 값은 반영되지 않고 직전 값이 유지된다. 에러가 없다.

### SET-06 Refresh 칸은 명언·단어에만 P1
- 절차: 날씨·시계·할 일 설정과 명언·단어 설정을 확인한다.
- 기대: `Refresh (sec)` 칸은 명언·단어에만 있다. 범위는 5–600.

### SET-07 깨진 설정 저장값 P2
- 절차: `card-settings:clock`을 `{"fontSize":999,"refreshSec":1}`로 시드하고 reload.
- 기대: 기본값(24px)으로 그려진다.

---

## 6. WTH 날씨

### WTH-01 정상 표시 P0 🖼
- 기대: 도시 `서울`, 기온 `21.5` + `°C`, `체감온도: 20.1°C`.

### WTH-02 요청 좌표 반올림 P1
- 절차: `browser_network_requests`(filter `open-meteo`).
- 기대: 요청 URL에 `latitude=37.57&longitude=126.98`이 들어 있다. 요청에 `current=temperature_2m,apparent_temperature`가 있다.

### WTH-03 위치 권한 거부 P1
- 절차: `context.clearPermissions()` 후 reload.
- 기대: `위치 권한이 필요합니다. 브라우저 권한을 확인해 주세요.`가 보인다. 환경에서 재현되지 않으면 SKIP. 끝나면 권한을 다시 준다.

### WTH-04 날씨 API 실패 P1
- 절차: open-meteo 목을 500으로 바꾸고 reload.
- 기대: `날씨 정보를 불러오지 못했습니다.`

### WTH-05 위치 이름 실패 P1
- 절차: bigdatacloud 목을 500으로 바꾸고 reload.
- 기대: 기온은 보이고 위치는 `알 수 없는 위치`.

### WTH-06 값 누락 P2
- 절차: open-meteo 응답을 `{"current":{}}`로 바꾸고 reload.
- 기대: 기온 자리에 `—`, `체감온도: —`.

### WTH-07 긴 위치 이름 자르기 P2
- 절차: bigdatacloud 응답 `city`를 100자로 바꾸고 reload.
- 기대: 화면에 보이는 위치가 80자 이하.

### WTH-08 ⏱ 한 시간마다 다시 받기 P1
- 절차: 시계 설치 상태에서 로드 → `network_requests`로 open-meteo 개수 확인 → `runFor(3600000)` → 다시 확인.
- 기대: 개수가 1 늘어난다. 60분 전에는 늘지 않는다(`runFor(1800000)` 뒤 변화 없음).

---

## 7. CLK 시계

### CLK-01 현재 시각 표시 P0
- 기대: 시계 카드에 `오전/오후 H:MM:SS` 형식의 시각이 보이고 기본 글자 24px.

### CLK-02 ⏱ 매초 갱신 P1
- 절차: `runFor(3000)`.
- 기대: 표시 시각이 3초 늘어난다(10:00:00 → 10:00:03).

---

## 8. POM 뽀모도로

### POM-01 초기 상태 P0 🖼
- 기대: 시간 `25:00`, 상태 `[Focus] #1`, 버튼 `Start`와 `Stop Alarm`, `구간 진행` 막대 `aria-valuenow=0`, 카드 `data-tone=focus`, 요약 `Focus 0분 / Break 0분 / Pause 0분 / Lost 0분`, `오늘 이력이 없습니다.`. 타이머 글자 80px.

### POM-02 시작과 일시정지 P0
- 절차: `Start` → 버튼 이름 확인 → 막대가 0이 아니게 될 때까지 대기(최대 20초) → `Pause` → 1.2초 대기 → 값 비교 → `Start`.
- 기대: 시작하면 버튼이 `Pause`, 시간이 줄고 막대가 찬다. 일시정지하면 버튼이 `Start`가 되고 막대 값이 멈춘다. 다시 `Start`하면 남은 시간부터 이어서 줄고 `Pause`가 된다.

### POM-03 단축키 P1
- 절차: 빈 곳을 클릭해 포커스를 비운 뒤 `Alt+S`를 두 번 누른다. 이어서 할 일 입력칸에 글자를 쓰다가 `Alt+S`를 누르고, 입력칸에서 `Esc`를 누른 뒤 다시 `Alt+S`. 입력칸에서 `Ctrl+Alt+S`(AltGr 조합)와 한글 조합 중 `Esc`도 눌러 본다.
- 기대: 첫 `Alt+S`는 시작(버튼 `Pause`), 두 번째는 일시정지. 입력칸에 커서가 있어도 `Alt+S`가 동작하고 커서와 글자는 그대로다. 입력칸에서 `Esc`를 누르면 글자는 남고 커서만 풀리며, 그 뒤 `Alt+S`도 동작한다. `Ctrl+Alt+S`는 타이머를 건드리지 않는다. 한글 조합 중 `Esc`는 커서를 풀지 않는다(`INFO`: 한글 입력기 필요, 단위 테스트가 `isComposing`으로 대신한다). `Alt+A`는 에러 없이 동작한다.

### POM-04 설정 범위 P0 🖼
- 절차: 톱니를 열어 Focus Time, Short Break, Long Break, Long Break Interval, Timer Text 각각 `늘리기/줄이기`를 끝까지 눌러 본다.
- 기대: 한도는 Focus 1–60, Short 1–30, Long 1–30, Interval 1–10, Timer Text 24–128. 한도에서 해당 버튼이 disabled. 범위 밖 직접 입력은 무시된다. 색 칸이 4개(Focus/Break/Pause/Lost 색)가 있다.

### POM-05 설정 저장 P0
- 절차: Focus 30, Short Break 7, Timer Text 64, Focus 색 `#ff00aa`로 바꾸고 Save → `Start`.
- 기대: `PomodoroSettings`에 값이 저장되고(`focusTime:30, shortBreak:7`, `focusColor:"#ff00aa"`), `PomodoroTimerTextSize`가 `64`. 시작하면 시간이 `30:00` 또는 `29:5x`. 타이머 글자는 64px, 색 `rgb(255, 0, 170)`. reload 뒤에도 유지된다.

### POM-06 닫으면 저장하지 않는다 P1
- 절차: Focus 40으로 바꾸고 `Close`(또는 `Esc`) → 다시 설정을 연다.
- 기대: 값이 저장된 값(기본 25)으로 돌아와 있다. 타이머 글자 크기도 원래대로.

### POM-07 카드 크기 조절은 이력만 늘린다 P1
- 절차: 카드 손잡이로 높이를 160px 줄였다 늘린다.
- 기대: 타이머 영역 높이는 변하지 않고(±2px) 이력 영역 높이만 줄고 늘어난다.

### POM-08 이력 요약과 라벨 P0 🖼
- 절차: 오늘 날짜로 `focusPeriod`를 `['Focus,09:00:00,09:25:00','Break,09:25:00,09:30:00','Lost,09:30:00,09:32:00']`로 시드하고 reload.
- 기대: 요약 `Focus 25분`, `Break 5분`, `Lost 2분`. 표 행 라벨 `Focus #1(25분)`, `Break #1(5분)`, `Lost (2분)`. 표 머리 `구분/시작/종료`.

### POM-09 라벨 길이 표기 P1
- 절차: `focusPeriod`를 `['Focus,09:00:00,09:00:30','Lost,09:01:00,09:02:00','Lost,09:03:00,09:03:01','Lost,09:04:00,09:06:00','Lost,09:07:00,09:08:05']`로 시드하고 reload.
- 기대: 라벨이 `Focus #1(30초)`, `Lost (60초)`, `Lost (1초)`, `Lost (2분)`, `Lost (1분5초)`. 1분까지는 초, 넘으면 분(+초).

### POM-10 Pause로 끊긴 텀은 같은 번호 P1
- 절차: `['Focus,09:00:00,09:10:00','Pause,09:10:00,09:10:10','Focus,09:10:10,09:25:00','Break,09:25:00,09:30:00','Focus,09:31:00,09:50:00']`로 시드하고 reload.
- 기대: 라벨이 `Focus #1(10분)`, `Pause (10초)`, `Focus #1(14분50초)`, `Break #1(5분)`, `Focus #2(19분)`.

### POM-11 오늘이 아닌 이력은 무시 P1
- 절차: `PomodoroFocusData.dateId`를 어제로 시드하고 reload.
- 기대: `오늘 이력이 없습니다.`, 상태 `[Focus] #1`.

### POM-12 새로고침 뒤 다음 구간 P1
- 절차: (a) 마지막 이력이 `Focus`이고 `focusCount:1`로 시드하고 reload. (b) 마지막 이력이 `Break`이고 `focusCount:2`로 시드하고 reload.
- 기대: (a) `[Break] #1`, `05:00`, `data-tone=break`. (b) `[Focus] #2`, `25:00`.

### POM-13 구간 색 반영 P1
- 절차: 이력(Focus·Break·Pause·Lost 한 줄씩)을 시드하고 설정에서 Focus `#ff0000`, Break `#00aa00`, Pause `#0000ff`, Lost `#aa00aa`로 저장.
- 기대: 요약 항목과 표 행 글자색이 각각 그 색이다. Save 직후(reload 없이) 반영된다.

### POM-14 깨진 저장값 P2
- 절차: `PomodoroSettings`를 `{"focusTime":999}`로, `PomodoroFocusData`를 `not json`으로 시드하고 reload.
- 기대: 에러 없이 기본값(25/5/15/4)과 빈 이력으로 시작한다.

### POM-15 ⏱ 집중이 끝나면 P0 🖼
- 준비: 설정에서 Focus Time 1, Short Break 1, Long Break 3, Interval 2로 저장. ntfy 토픽을 `desk-test`로 저장.
- 절차: `Start` → `runFor(61000)`.
- 기대: 상태 `Unmanaged`, 버튼 `Start`, 타이머 글자가 `+00:0x` 형태로 지나간 시간을 센다. 막대는 구간이 끝나 100%로 가득 찬다. `PomodoroFocusData`에 `Focus` 한 줄이 저장된다. 이력 표는 5초마다 갱신되므로 `runFor(5000)` 뒤에 `Focus #1(60초)` 또는 `Focus #1(1분1초)`가 보인다(60초까지는 초로 적는다). ntfy 요청이 `POST https://ntfy.sh/desk-test`, 본문 `뽀모도로: Focus 끝`으로 1회 나간다. 토픽이 비어 있으면 ntfy 요청이 없다.

### POM-16 ⏱ 휴식으로 이어가기 P0
- 절차: POM-15 직후(60초 안에) `Start`.
- 기대: 상태 `[Break] #1`, 시간 `01:00`, `data-tone=break`, 버튼 `Pause`. `runFor(61000)` 뒤 `Break #1` 행이 생기고 ntfy 본문이 `뽀모도로: Break 끝`.

### POM-17 ⏱ 다음 집중 번호와 긴 휴식 P1
- 절차: POM-16 뒤 `Start`(→ `[Focus] #2`) → `runFor(61000)` → `Start`.
- 기대: `[Focus] #2`로 시작한다. 두 번째 집중 뒤 휴식은 긴 휴식이라 `[Break] #2`, 시간 `03:00`.

### POM-18 ⏱ 일시정지한 시간이 텀 끝에 함께 남는다 P1
- 준비: Focus Time 1로 저장.
- 절차: `Start` → `runFor(10000)` → `Pause` → `runFor(5000)` → `Start` → `runFor(51000)`.
- 기대: 끝난 뒤 이력에 `Focus`, `Pause`, `Focus` 세 줄. 라벨이 `Focus #1(10초)`, `Pause (5초)`, `Focus #1(50초)` 근처(±1초). 일시정지 중에는 이력에 아직 나타나지 않고, 이력 표는 `runFor(5000)` 뒤에 보인다.

### POM-19 ⏱ 1분 지나면 Lost P0 🖼
- 준비: Focus Time 1로 저장.
- 절차: `Start` → `runFor(61000)` → `runFor(61000)`.
- 기대: 상태가 `[Lost] #n`으로 바뀌고 `data-tone=lost`, 타이머 글자색이 Lost 색. 지나간 시간이 계속 `+MM:SS`로 센다. 이때 `Start`를 누르면 이력에 `Lost` 행이 추가되고(길이 약 1분) 타이머가 다시 돈다. 다음 구간 종류는 기록만 한다(`INFO`).

### POM-20 ⏱ 시간 경과 후 가까운 시작 P2
- 절차: 집중이 끝나고 30초 뒤 `Start`.
- 기대: Lost 행이 생기지 않는다. 바로 `[Break] #1`로 시작한다.

### POM-21 Stop Alarm P2
- 절차: `Stop Alarm` 클릭, `Alt+A` 입력.
- 기대: 에러가 없다. 타이머 상태에 영향이 없다.

---

## 9. QTE 명언

### QTE-01 첫 화면 P0
- 기대: `한 구간만 끝내면 다음이 가벼워진다.` / `momentum`, `명언 남은 시간` 막대, `명언 새로고침` 버튼.

### QTE-02 새로고침 순서 P0
- 절차: `명언 새로고침`을 5번 누른다.
- 기대: 순서대로 `시작은 작게, 끝은 오늘 안으로.` → `흐트러지면 다시 25분이다.` → `자리로 돌아오는 것도 일이다.` → `끝난 시간을 세지 말고 다음 시작을 눌러라.` → 처음 문장으로 돌아온다.

### QTE-03 ⏱ 1분마다 자동 전환 P0
- 절차: `runFor(59000)` → 확인 → `runFor(2000)`.
- 기대: 59초에는 첫 문장, 61초에는 둘째 문장. 새로고침 직후에는 시간이 다시 처음부터 센다(`runFor(59000)` 뒤에도 안 바뀜).

### QTE-04 ⏱ 새로고침 간격 설정 P1
- 절차: 설정에서 Refresh를 5로 저장 → `runFor(5500)`.
- 기대: 5초 뒤 다음 문장으로 바뀐다. 4초 시점에는 그대로. 저장값 `card-settings:quote.refreshSec=5`.

### QTE-05 글자 크기 설정 P2
- 절차: Font Size 30으로 저장.
- 기대: 문장 글자가 30px.

---

## 10. WRD 단어

### WRD-01 기본 표시 P0 🖼
- 기대: 첫 단어 `focus`, 뜻 `steady attention`, `단어 남은 시간` 막대, `단어 새로고침`, 입력 `단어 추가`(placeholder `english`).

### WRD-02 단어 추가 P0
- 절차: `Don't`, `well-known`을 차례로 추가.
- 기대: 소문자 `don't`, `well-known`으로 저장된다. 추가 즉시 목록이 열리고 방금 추가한 단어가 표시된다. 입력칸이 비워진다. `wordList`에 반영된다.

### WRD-03 잘못된 단어 거부 P0
- 절차: `abc123`, `a b`, `1abc`, 빈 칸, 공백만, 41자 영문, 이미 있는 단어(`focus`, 대문자 `FOCUS`)를 각각 추가.
- 기대: 모두 목록이 늘지 않는다. 입력칸에 쓴 글자는 그대로 남는다(빈 칸 제외).

### WRD-04 최대 20개 P1
- 절차: 서로 다른 단어 20개로 시드하고 reload → 21번째 추가.
- 기대: 추가되지 않는다. 목록 길이 20.

### WRD-05 전체 목록과 삭제 P0
- 절차: `전체 목록` 클릭 → 단어 클릭 → `<단어> 삭제`.
- 기대: 토글로 열고 닫힌다. 단어를 누르면 그 단어가 현재 단어로 바뀐다. 삭제하면 목록에서 사라지고, 현재 단어를 지우면 첫 번째 단어로 돌아간다.

### WRD-06 전부 삭제 P2
- 절차: 모든 단어를 삭제한 뒤 reload.
- 기대: 삭제 직후 `단어가 없습니다.`와 안내 문구가 보이고 남은 시간 막대가 없다. reload 뒤에는 기본 단어(focus, steady, clear)로 복원된다.

### WRD-07 새로고침 P1
- 절차: `단어 새로고침`을 5번 누른다.
- 기대: 누를 때마다 현재와 다른 단어가 나온다(단어가 2개 이상일 때).

### WRD-08 뜻 조회 실패 P1
- 절차: dictionaryapi 목을 (a) 404, (b) `[]`, (c) 네트워크 중단(`route.abort()`)으로 바꾼다.
- 기대: 모두 `뜻을 찾지 못했습니다.`. 앱은 멈추지 않는다.

### WRD-09 뜻은 글자로만 보인다 P0
- 절차: dictionaryapi 응답의 `definition`을 `<img src=x onerror="window.__xss=1"><b>bold</b>`로 바꾸고 reload.
- 기대: 태그가 글자 그대로 보이고 `window.__xss`가 undefined다. DOM에 `img` 요소가 생기지 않는다.

### WRD-10 ⏱ 1분마다 자동 전환 P1
- 절차: `runFor(61000)`.
- 기대: 현재 단어가 다른 단어로 바뀐다.

### WRD-11 설정 P2
- 절차: 단어 설정에서 Font Size 40, Refresh 10으로 저장.
- 기대: 단어 글자 40px. `card-settings:words`에 저장.

---

## 11. TDO 할 일

### TDO-01 추가·완료·삭제 P0 🖼
- 절차: `write tests` 추가 → 체크 → 삭제.
- 기대: 처음에는 `할 일을 추가하면 여기에 쌓인다.`와 `남은 0 · 전체 0`. 추가하면 `남은 1 · 전체 1`, 체크하면 `남은 0 · 전체 1`과 취소선(완료 스타일). 삭제하면 빈 안내가 돌아온다. `todoList`에 저장되고 reload 뒤에도 유지된다.

### TDO-02 입력 검증 P0
- 절차: 빈 칸, 공백만, 81자 이상, 앞뒤 공백이 있는 글자, `a@b` 형태를 추가.
- 기대: 빈 칸·공백은 추가되지 않는다. 81자 이상은 80자로 잘려 들어간다. 앞뒤 공백은 지워진다. `@`는 마감 입력을 열고 글자에서는 빠진다.

### TDO-03 Enter 제출 P2
- 절차: 입력칸에서 글자를 쓰고 `Enter`.
- 기대: `추가` 버튼과 같이 항목이 추가된다.

### TDO-04 최대 40개 P1
- 절차: 40개로 시드하고 reload → 추가.
- 기대: 추가되지 않는다. `전체 40`. 입력칸의 글자가 남는다.

### TDO-05 더블 클릭 고치기 P0
- 절차: 글자를 더블 클릭 → 새 글자 입력 → `Enter`. 다시 더블 클릭 → 입력 → `Esc`. 다시 더블 클릭 → 글자를 모두 지움 → `Enter`. 마지막으로 더블 클릭 → 입력 → 다른 곳 클릭.
- 기대: `Enter`는 저장. `Esc`는 취소(원래 글자 유지). 빈 글자로는 저장되지 않고 원래 글자가 남는다. 포커스를 잃으면 저장된다. 편집 칸 너비가 줄 너비의 60% 이상.

### TDO-06 긴 글자 말줄임 P2
- 절차: 80자 글자를 추가.
- 기대: 줄에서는 말줄임으로 보이고 `title` 속성에 전체 글자가 있다.

### TDO-07 Alt+T P1
- 절차: 빈 곳을 클릭하고 `Alt+T` → 다른 입력칸(단어 추가)에서 `Alt+T`.
- 기대: 첫 `Alt+T`에서 `할 일 추가` 칸에 포커스가 간다. 다른 입력칸에 포커스가 있을 때는 동작하지 않는다(`Alt+S`·`Alt+A`와 달리 입력칸에서는 받지 않는다).

### TDO-08 마감 입력 P0
- 절차: 입력에 `meeting @` 입력. 시 칸을 현재 시보다 작게(예: 0) 입력. 분 칸에 `75`, `abc` 입력.
- 기대: `마감 시`, `마감 분` 칸이 나타난다. 초기값은 현재 시·분 이상. 지금보다 이른 시각은 현재 시각으로 되돌려진다. 분 75, 글자는 무시된다. `@`를 지우면 칸이 사라진다.

### TDO-09 마감이 있는 항목 P0 🖼
- 절차: `meeting @`로 현재보다 5분 뒤 시각을 넣어 추가.
- 기대: 항목에 `HH:MM` 마감 표시와 `meeting 마감` 막대(`progressbar`, 0%)가 생긴다. 글자에는 `@`가 없다. `todoList`에 `dueMinutes`·`startMinutes`가 저장된다. 마감이 없는 항목에는 막대가 없다.
- 알려진 문제(2026-11-11 확인, 아직 안 고침): `startMinutes`를 분 단위로 잘라 저장해서 넣은 직후 막대가 0이 아니라 그 분의 경과 초만큼 차 있다. 이 케이스는 FAIL로 기록한다.

### TDO-10 ⏱ 마감 진행과 알람 P0 🖼
- 절차: ntfy 토픽 `desk-test` 저장. 시각 10:00에서 `meeting @`, 마감 분 `2`(10:02)로 추가. `runFor(60000)` → 확인 → `runFor(61000)` → 확인.
- 기대: 10:01에는 막대가 약 50%, 상태 `open`. 10:02가 지나면 막대 100%, `data-state=over`(붉은색), 우하단에 `할 일 알람` 토스트(`할 일 알람 meeting`, 마감 `10:02`, `확인` 버튼)가 쌓인다. ntfy에 `POST https://ntfy.sh/desk-test`, 본문 `할 일: meeting (10:02)`가 1회 나간다. 같은 항목에 대해 다시 나가지 않는다.

### TDO-11 ⏱ 알람 확인 P0
- 절차: TDO-10 뒤 `확인` 클릭 → reload.
- 기대: 토스트가 사라진다. `todoList`에서 그 항목 `alarmed:true`. reload 뒤에도 토스트가 다시 뜨지 않는다. 막대는 계속 붉은색.

### TDO-12 ⏱ 완료하면 알람이 없다 P1
- 절차: 10:00에 `meeting @` 10:01로 추가 → 바로 체크 → `runFor(120000)`.
- 기대: 토스트가 뜨지 않고 막대 `data-state=done`. ntfy 요청이 없다. 체크를 풀면 상태가 다시 `open`/`over`로 돌아가고 알람이 다시 울릴 수 있다(`INFO`: 실제 동작 기록).

### TDO-13 ⏱ 마감 없는 항목은 알람이 없다 P2
- 절차: 마감 없는 항목을 추가하고 `runFor(3600000)`.
- 기대: 토스트·ntfy가 없다.

### TDO-14 일정 `#` 입력 P0 🖼
- 절차: 입력에 `lunch #` 입력.
- 기대: `일정 날짜`(오늘, `min`=오늘)와 `일정 시각 (비우면 종일)` 칸이 나타나고 제출 버튼이 `캘린더에 추가`로 바뀐다. `@`도 함께 넣으면(`lunch # @`) `#`가 우선이라 마감 칸은 나오지 않는다.

### TDO-15 일정을 캘린더로 연다 P0
- 절차: `lunch #`, 날짜 내일, 시각 비움 → 제출. 이어서 같은 방식으로 시각 `14:30`.
- 기대: 새 탭이 열리고(`context.waitForEvent('page')`) 주소가 `https://calendar.google.com/calendar/render`로 시작한다. 검색 파라미터 `action=TEMPLATE`, `text=lunch`. 시각이 없으면 `dates=<내일>/<모레>`(`YYYYMMDD`, 하루 종일), 있으면 `dates=<내일>T143000/<내일>T153000`(1시간). 제출 후 입력칸이 비워지고 **할 일 목록에 `lunch` 항목이 남는다**(TDO-19). 새 탭은 닫는다.

### TDO-16 일정 거부 P1
- 절차: (a) 제목이 `#`뿐일 때 제출. (b) 날짜를 어제로 직접 입력하고 제출. (c) 날짜를 지운 채 제출.
- 기대: 모두 새 탭이 열리지 않고 입력이 유지된다.

### TDO-17 깨진 저장값 P2
- 절차: `todoList`를 `not json`, `[{"id":"!!","text":"x","done":false}]`로 시드하고 reload.
- 기대: 에러 없이 빈 목록으로 시작한다.

### TDO-19 목록에 남은 일정 P0 🖼
- 준비: 시계 설치(⏱) 2026-11-20 09:00. 할 일을 `#`로 넣는다: 오늘 17:00, 내일 종일, 12일 뒤 09:00, 오늘 11:00. 캘린더 새 탭은 `context.route`로 막고 닫는다.
- 절차: `runFor`로 15:00까지 흘린다. 오늘 11:00 일정 하나는 체크한다. reload.
- 기대: 각 항목 뒤에 `오늘 17:00`, `내일 종일`, `12월 2일 09:00`, `오늘 11:00`(영어 `Today, 17:00`, `Tomorrow, all day`, `Dec 2, 09:00`). 막대 이름은 `<글자> 일정`(영어 `<text> event`). 15:00에 17:00 일정은 75%, 내일 종일은 40%, 12일 뒤는 2% 근처. 지난 11:00 일정은 체크 전 100%·`data-state=over`, 체크 후 `done`. 종일 일정은 그날이 끝나야 `over`. 일정에는 할 일 알람 토스트와 ntfy가 없다. `todoList`에 `event: {date, time, createdAt}`가 저장되고 reload 뒤에도 같다. 해가 다른 일정은 연도가 붙는다(`2027년 1월 2일 종일`).

### TDO-18 설정 P2
- 절차: 할 일 설정에서 Font Size 20 저장.
- 기대: 목록 글자 20px. `Refresh` 칸은 없다.

---

## 12. NTF 푸시 알림·THM 테마

### NTF-01 모달 P0
- 절차: 상단 `푸시 알림` 클릭.
- 기대: `푸시 알림` 이름의 dialog, `ntfy 토픽` 입력(placeholder `비우면 보내지 않음`), 안내 문구(`토픽 이름이 비밀번호다.` 포함).

### NTF-02 토픽 저장 P0
- 절차: `desk-42` 입력 → Save → reload → 다시 열기.
- 기대: `localStorage['ntfy-topic'] === 'desk-42'`, 다시 열면 `desk-42`가 채워져 있다.

### NTF-03 입력 정리 P1
- 절차: `my topic!@#한글_ok-1` 입력. 이어서 70자 입력.
- 기대: 허용 글자(`A-Za-z0-9_-`)만 남아 `mytopic_ok-1`이 된다. 64자까지만 들어간다.

### NTF-04 비우고 저장 P1
- 절차: 저장된 토픽을 지우고 Save.
- 기대: `ntfy-topic` 키가 삭제된다.

### NTF-05 Close·Esc는 저장하지 않는다 P1
- 절차: 값을 바꾸고 `Close`, 다시 바꾸고 `Esc`.
- 기대: 저장값이 바뀌지 않고, 다시 열면 저장된 값이 보인다.

### THM-01 테마 목록 P0
- 기대: `테마` select에 `기본, 스큐어모피즘, 플랫, 머티리얼, 뉴모피즘, 글래스모피즘, 클레이모피즘, 네오 브루탈리즘, 리퀴드 글래스, 3D 아이콘` 10개.

### THM-02 모든 테마 적용 P0 🖼
- 절차: 값 `default, skeu, flat, material, neu, glass, clay, brutal, liquid, icons3d`를 차례로 선택하고 각각 스크린샷(`THM-02-<id>.png`).
- 기대: `default`는 `html`에 `data-theme`가 없고, 나머지는 `data-theme=<id>`. 각 테마에서 6개 카드와 `Start` 버튼이 보이고 콘솔 에러가 없다. `flat`에서 `Start`의 `border-radius`가 `0px`, `default`에서 `999px`. `localStorage['momentum-theme']`가 마지막 선택값.

### THM-03 테마 유지 P1
- 절차: `flat` 선택 → reload.
- 기대: select가 `플랫`, `data-theme=flat`.

### THM-04 깨진 테마 값 P2
- 절차: `momentum-theme`을 `bogus`로 시드하고 reload.
- 기대: 기본 테마, select는 `기본`.

---

## 13. 견고성·접근성·반응형 (Phase 3)

### RBS-01 모든 저장값이 깨졌을 때 P0
- 절차: `feature-card:*`(6개), `visible-cards`, `card-settings:*`(5개), `PomodoroSettings`, `PomodoroTimerTextSize`, `PomodoroFocusData`, `todoList`, `wordList`, `ntfy-topic`, `momentum-theme` 키를 모두 `not json`(또는 `null`)로 채우고 reload.
- 기대: 앱이 그려지고 기본 상태로 동작한다. 콘솔에 처리되지 않은 에러가 없다.

### RBS-02 모두 비웠을 때 P0
- 절차: `localStorage.clear()` 후 reload.
- 기대: BRD-01과 같은 첫 화면.

### RBS-03 키보드 P2
- 절차: `Tab`으로 상단 → 카드 버튼 → 입력 순서로 이동. 모달을 열고 `Esc`.
- 기대: 포커스가 보이고 모든 버튼에 접근 이름이 있다. 모달은 `Esc`로 닫힌다.

### RBS-04 외부 요청 범위 P1
- 절차: 하루 흐름(로드, 단어 추가, 알람)을 마친 뒤 `browser_network_requests`(static 포함)를 훑는다.
- 기대: 나간 도메인이 `api.open-meteo.com`, `api.bigdatacloud.net`, `api.dictionaryapi.dev`, `ntfy.sh`(토픽이 있을 때만), 정적 파일뿐이다. 구글 계정·캘린더로 요청이 나가지 않는다(새 탭 열기 제외).

### RSP-01 화면 크기별 배치 P2 🖼
- 절차: 1920×1080, 1280×900, 1024×768, 800×600에서 로드하고 스크린샷(`RSP-01-<너비>.png`).
- 기대: 카드가 `header.mast`와 겹치지 않고 모든 카드의 헤더가 보인다. 가로 스크롤 발생 여부는 `INFO`로 기록한다.

### RSP-02 이동 후 크기 변경 P2
- 절차: 카드를 옮겨 둔 채 1280×900 → 800×600 → 1280×900으로 바꾼다.
- 기대: 줄일 때 뷰포트 안으로 들어오고 에러가 없다. 다시 키워도 카드 헤더가 잡힌다.

---

## 14. I18N 화면 언어

언어 케이스는 한국어 기준 전제의 예외다. 각 케이스는 초기화에서 시작한다.

### I18N-01 영어 브라우저는 영어로 시작 P0 🖼
- 준비: 컨텍스트 `locale: 'en-US'`, 초기화.
- 절차: 로드.
- 기대: `html[lang=en]`. 카드 제목이 `Weather, Clock, Pomodoro, Quote, Words, To-do`. 상단 `Language`, `Theme`, `Push notifications`, `Card list`. 부제 `Focus today: 0 min · YYYY-MM-DD`. 시계가 `h:mm:ss AM/PM`. 한국어 문구가 화면에 남지 않는다(언어 선택의 `한국어` 제외).

### I18N-02 한국어 브라우저는 한국어로 시작 P0
- 준비: 컨텍스트 `locale: 'ko-KR'`, 초기화.
- 기대: `html[lang=ko]`, 카드 제목이 한국어, 부제 `오늘 집중 0분 · YYYY-MM-DD`. 한국어가 첫 언어가 아닌 `['en-US', 'ko']`는 영어로 시작한다(`INFO`: 컨텍스트 `locale`로 재현).

### I18N-03 언어 전환과 저장 P0 🖼
- 절차: `언어`에서 `English` 선택 → 카드·설정 모달·푸시 알림 모달·카드 목록을 확인 → reload → `Language`에서 `한국어` 선택.
- 기대: 선택 즉시 새로고침 없이 모든 문구가 바뀐다(카드 제목, 버튼의 접근 이름 `Weather settings`/`Pin Weather`/`Close Weather`, 설정 모달 제목 `Weather settings`·`Interval lengths`·`Quote settings`·`Word settings`·`To-do settings`, 푸시 알림 모달 `Push notifications`·`ntfy topic`, 테마 이름 10개). `localStorage['momentum-lang']`가 `en`이고 reload 뒤에도 영어다. 한국어로 되돌리면 모두 한국어로 돌아온다. 카드 위치·고정·할 일 같은 데이터는 바뀌지 않는다.

### I18N-04 영어 화면의 문구 점검 P1
- 준비: 영어 선택, 오늘 이력 시드(`Focus 09:00–09:25`, `Break 09:25–09:30`, `Lost 09:30:00–09:30:10`, `Lost 09:31–09:32:02`).
- 기대: 이력 라벨 `Focus #1(25 min)`, `Break #1(5 min)`, `Lost (10 s)`, `Lost (1 min 2 s)`. 이력 머리 `Type/Start/End`, 캡션 `Focus history`, 비었을 때 `No history today.`. 할 일 `0 left · 0 total`, 입력 `Add a to-do`, `#` 입력 시 `Add to Calendar`·`Event date`, `@` 입력 시 `Deadline hour/minute`. 단어 `Add a word`·`All words`·`Meaning not found.`(사전 404 목). 날씨 오류 `This browser does not support geolocation.` 등.

### I18N-05 영어 화면의 날씨와 시계 P1
- 절차: 영어로 로드하고 bigdatacloud 요청을 `network_requests`로 본다. 한국어로 바꾼 뒤 다시 본다.
- 기대: 요청에 `localityLanguage=en`(한국어면 `ko`)이 붙는다. 언어를 바꾸면 날씨가 새 언어로 다시 요청된다(도시 이름이 `Seoul` ↔ `서울`). 시계 형식이 `h:mm:ss AM/PM` ↔ `오전/오후 h:mm:ss`. 체감온도 `Feels like: 20.1°C`.

### I18N-06 ⏱ 영어 화면의 알림 문구 P1
- 준비: 영어 선택, ntfy 토픽 `desk-test`, Focus Time 1.
- 절차: 집중을 끝낸다(`runFor(61000)`). `meeting @`로 마감 10:02인 할 일을 만들고 마감을 지난다.
- 기대: ntfy 본문이 `Pomodoro: Focus ended`, `To-do: meeting (10:02)`. 토스트가 `To-do alarm`·`OK`. 한국어로 바꾸면 `뽀모도로: Focus 끝`, `할 일: meeting (10:02)`.

### I18N-07 헤더 줄바꿈 P2 🖼
- 절차: 1920, 1280, 1024, 800 너비에서 두 언어로 로드한다.
- 기대: 헤더가 좁으면 두 줄로 접히고, 모든 카드가 `header.mast` 아래에 있으며 가로 스크롤이 없다. (측정: 1280까지는 한 줄 77px, 영어 1024와 두 언어 800은 두 줄 123px.)

---

## 15. 참고: 문서와 구현이 맞는지 볼 항목

케이스를 수행하다 아래가 눈에 띄면 `INFO`로 보고서에 남긴다. 판정 대상은 아니다.

- README는 개발 주소를 `/momentum_card`로 적지만 개발 서버는 `/`에서 열린다.
- 집중 도중 Pause 시간은 텀이 끝나야 이력에 남는다(README: "그 텀이 끝날 때 함께 남는다").
- `Lost` 뒤 `Start`가 고르는 다음 구간 종류(집중/휴식).
- 단어를 모두 지웠다가 reload하면 기본 단어가 복원된다.
