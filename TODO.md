# TODO List

# 토모도로 타이머, 날씨, 명언, TODO, 하루의 관리

**간략한 앱이기 때문에 메모리 사용을 최소화하고 가볍게 유지되야한다.**

## 지침

- 지침 부분은 삭제하지마라.
- `## 계획`을 확인하고 `## 답변`에 답변만 작성해라. (구현은 하지 않는다.)
- `## 작업`을 확인하여 구현을 진행한다.
  - 완료되면 체크박스를 체크한다.
  - `## 답변` 영역에 발생 원인 및 간략한 구현 내용을 작성해라.
- CHANGELOG.md 와 README.md 파일을 늘 최신으로 유지해라
- `깃에 올려` 라고 하면 적당한 메시지를 추가해서 git commit/push 해라
- `배포해` 라고 하면 master 에 병합하고, 태그 추가하고, gh pages 배포해라

## 계획

## 작업

- [x] exe 파일을 직접 빌드하게 할순없으니 momentum.exe 파일도 assets 에 배포해줘


- [x] 깃에 올리고 배포해줘

## 답변

`momentum.exe`를 GitHub Releases의 Assets로 올렸다. README에 받는 곳(`releases/latest`)과 SmartScreen 안내를 적었다. 서명하지 않은 파일이라 릴리스 노트에 SHA256을 함께 적었다. 이름을 늘 `momentum.exe`로 두어 `releases/latest/download/momentum.exe` 주소가 항상 최신 파일을 가리킨다.

exe 파일 정보의 버전이 0.1.0에 고정돼 있어서 `tauri.conf.json`의 `version`을 `../package.json`으로 바꿨다. 이제 릴리스 버전과 같다.

다음 릴리스부터는 `npm run tauri build -- --no-bundle`로 exe를 만든 뒤 `gh release create vX.Y.Z --title vX.Y.Z --notes-file <노트> src-tauri/target/release/momentum.exe`로 올린다. 앱은 배포 주소를 열기 때문에 웹만 바뀐 릴리스에는 exe를 다시 올리지 않아도 된다. 창 크기 저장이나 캘린더 열기처럼 `src-tauri`가 바뀐 릴리스에만 다시 올린다.

