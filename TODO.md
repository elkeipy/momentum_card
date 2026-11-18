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
  - 먼저 `git fetch` 하고 `origin/master` 를 develop 에 머지해라. Dependabot PR 이 master 로 바로 머지되므로 develop 이 뒤처져 있으면 `--ff-only` 병합이 실패한다.

## 계획

## 작업

- [x] 깃에 올리고, 배포해

## 답변

v0.2.18로 올렸다. README를 기능 소개 페이지 형식으로 다시 썼고(화면 이미지는 `docs/`), 앞서 넣은 GitHub Actions CI가 master에 들어갔다. 이제 Dependabot PR도 master로 머지하기 전에 타입체크, 단위 테스트, 빌드 검사를 거친다.

`src-tauri`는 바뀌지 않아서 `momentum.exe`는 다시 올리지 않았고, GitHub Release도 만들지 않고 태그만 붙였다. 새 릴리스를 만들면 `releases/latest`가 exe 없는 릴리스를 가리켜 README의 다운로드 주소가 깨진다.
